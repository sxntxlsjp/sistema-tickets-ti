const prisma = require('../config/prisma');
const runtimeLogger = require('../utils/runtimeLogger.util');

const DB_QUERY_TIMEOUT_MS = 3000;

// Reintentos acotados (Sprint 21, Fase 6): 1er reintento a los 5s, luego 15s, luego
// 30s, después estable cada 60s. Un único setTimeout con unref() — nunca varios
// timers ni un setInterval agresivo.
const RETRY_DELAYS_AFTER_FAILURE_MS = [5000, 15000, 30000];
const STEADY_STATE_INTERVAL_MS = 60000;

const state = {
    databaseReady: false,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastLatencyMs: null,
    consecutiveFailures: 0
};

let retryTimer = null;
let inFlightCheck = null;
let isStopped = true;

// Clasificación central de errores de conexión (Fase 9). Nunca confunde un error de
// validación funcional con una caída de infraestructura: solo se usa sobre errores
// que ya vinieron de intentar hablar con la base.
//
// Con el adapter pg (Sprint 21), los errores de conexión ya no llegan como
// PrismaClientInitializationError (forma del motor Rust) sino envueltos en
// PrismaClientKnownRequestError (código P2010, "raw query failed"), con el motivo
// real solo en el mensaje. Por eso se revisa el texto del mensaje además del
// nombre/código — es la señal que realmente distingue "no hay red hacia Neon" de
// un error de validación funcional.
const classifyDbError = (error) => {
    if (error?.name === 'PrismaClientRustPanicError') return 'rust_panic';
    if (error?.message === 'database readiness check timeout') return 'timeout';
    if (error?.code === 'ECONNREFUSED') return 'connection_refused';
    if (error?.code === 'ETIMEDOUT') return 'timeout';

    const message = error?.message || '';

    if (/can't reach database server|connection terminated|connect ECONNREFUSED/i.test(message)) {
        return 'connection_refused';
    }
    if (/timeout/i.test(message)) return 'timeout';

    if (error?.name === 'PrismaClientInitializationError') return 'temporary_unavailable';
    if (error?.name === 'PrismaClientKnownRequestError') return 'known_request_error';
    return 'unknown';
};

const getNextDelayMs = (consecutiveFailures) => {
    if (consecutiveFailures <= 0) return STEADY_STATE_INTERVAL_MS;

    const index = consecutiveFailures - 1;

    return index < RETRY_DELAYS_AFTER_FAILURE_MS.length
        ? RETRY_DELAYS_AFTER_FAILURE_MS[index]
        : STEADY_STATE_INTERVAL_MS;
};

const scheduleNext = (delayMs) => {
    if (isStopped) return;

    clearTimeout(retryTimer);
    retryTimer = setTimeout(runScheduledCheck, delayMs);
    retryTimer.unref();
};

// Único punto de verificación real. Si ya hay un check en curso (programado o pedido
// bajo demanda vía /api/health/database), todos los llamadores esperan la MISMA
// promesa en vez de disparar una segunda consulta — "no permitir más de un check
// concurrente" aplica a todo el proceso, no solo al temporizador de fondo.
const performCheck = () => {
    if (inFlightCheck) return inFlightCheck;

    inFlightCheck = runCheckOnce().finally(() => {
        inFlightCheck = null;
    });

    return inFlightCheck;
};

const runCheckOnce = async () => {
    const startedAt = Date.now();

    runtimeLogger.log('database.readiness_check.start');

    let timeoutHandle;

    const timeout = new Promise((_, reject) => {
        timeoutHandle = setTimeout(
            () => reject(new Error('database readiness check timeout')),
            DB_QUERY_TIMEOUT_MS
        );
    });

    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            timeout
        ]);

        clearTimeout(timeoutHandle);

        const latencyMs = Date.now() - startedAt;
        const wasDown = !state.databaseReady;

        state.databaseReady = true;
        state.lastSuccessAt = new Date().toISOString();
        state.lastLatencyMs = latencyMs;
        state.consecutiveFailures = 0;

        runtimeLogger.log(
            wasDown ? 'database.readiness_recovered' : 'database.readiness_check.success',
            { latencyMs }
        );

        return true;

    } catch (error) {
        clearTimeout(timeoutHandle);

        const latencyMs = Date.now() - startedAt;
        const wasReady = state.databaseReady;
        const errorType = classifyDbError(error);

        state.databaseReady = false;
        state.lastFailureAt = new Date().toISOString();
        state.consecutiveFailures += 1;

        // Reducción de ruido: el primer fallo se registra completo (sanitizado); los
        // siguientes solo como resumen, para no repetir el mismo stack cada minuto.
        if (state.consecutiveFailures === 1) {
            runtimeLogger.logError('database.readiness_check.failure', error, {
                errorType,
                latencyMs,
                consecutiveFailures: state.consecutiveFailures
            });
        } else {
            runtimeLogger.log('database.readiness_check.failure', {
                errorType,
                latencyMs,
                consecutiveFailures: state.consecutiveFailures
            });
        }

        if (wasReady) {
            runtimeLogger.log('database.readiness_degraded', { errorType });
        }

        return false;

    } finally {
        scheduleNext(getNextDelayMs(state.consecutiveFailures));
    }
};

// runCheckOnce ya atrapa cualquier error de la consulta en su propio try/catch, pero
// este .catch() es una red de seguridad adicional: un check de readiness jamás debe
// poder escalar a unhandledRejection y disparar un cierre del proceso por una
// indisponibilidad temporal de Neon (justamente lo que este Sprint busca evitar).
const runScheduledCheck = () => {
    performCheck().catch((error) => {
        runtimeLogger.logError('database.readiness_check.unexpected_error', error);
    });
};

const start = () => {
    isStopped = false;
    runScheduledCheck();
};

const stop = () => {
    isStopped = true;
    clearTimeout(retryTimer);
    retryTimer = null;
};

const getState = () => ({ ...state });

module.exports = {
    start,
    stop,
    getState,
    performCheck,
    classifyDbError
};
