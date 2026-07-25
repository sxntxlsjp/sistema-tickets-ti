require('dotenv').config({ quiet: true });

const runtimeLogger = require('./utils/runtimeLogger.util');
const prisma = require('./config/prisma');
const readinessService = require('./services/readiness.service');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server;
let isShuttingDown = false;

// Cierre ordenado (Sprint 20/21). isShuttingDown evita ejecutar el flujo dos veces.
// El timeout de seguridad garantiza que el proceso termine aunque el cierre limpio
// se cuelgue. pool.end() se llama a través de prisma.disconnect(), que es idempotente.
const shutdown = async (reason, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    runtimeLogger.log('shutdown.start', { reason });

    const forceExitTimer = setTimeout(() => {
        runtimeLogger.log('shutdown.timeout_forced', { reason });
        process.exit(exitCode || 1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    readinessService.stop();

    if (server) {
        try {
            await new Promise((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()));
            });
        } catch (error) {
            runtimeLogger.logError('shutdown.http_close_failed', error);
        }
    }

    try {
        await prisma.disconnect();
    } catch (error) {
        runtimeLogger.logError('shutdown.prisma_disconnect_failed', error);
    }

    clearTimeout(forceExitTimer);
    runtimeLogger.log('shutdown.complete', { reason });
    process.exit(exitCode);
};

// Arranque inmediato compatible con Hostinger (Sprint 21, Fase 5). Hostinger exige
// listen() en menos de 3 segundos o levanta procesos adicionales — por eso Express
// escucha ANTES de saber si Prisma/Neon están disponibles. La comprobación de base
// corre en segundo plano, sin bloquear, sin bucles agresivos y sin poder terminar
// el proceso por una indisponibilidad temporal.
const start = () => {
    runtimeLogger.logRuntimeStart();

    server = app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        runtimeLogger.log('runtime.listening', {
            port: Number(PORT),
            engineType: 'client',
            adapter: 'pg',
            poolMax: 3
        });
    });

    server.on('error', (error) => {
        runtimeLogger.logError('runtime.listen_failed', error);
        shutdown('listen_error', 1);
    });

    readinessService.start();
};

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Errores globales. No se intenta seguir funcionando tras un uncaughtException: se
// registra y se ejecuta el cierre controlado. No se reconstruye PrismaClient ni el
// Pool en ningún punto de este archivo — siempre la misma instancia importada.
process.on('uncaughtException', (error) => {
    runtimeLogger.logError('runtime.uncaught_exception', error, {
        clientVersion: error?.clientVersion,
        isPrismaRustPanic: error?.name === 'PrismaClientRustPanicError'
    });

    shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    runtimeLogger.logError('runtime.unhandled_rejection', error, {
        clientVersion: error?.clientVersion,
        isPrismaRustPanic: error?.name === 'PrismaClientRustPanicError'
    });

    shutdown('unhandledRejection', 1);
});

process.on('beforeExit', (code) => {
    runtimeLogger.log('runtime.before_exit', { code });
});

process.on('exit', (code) => {
    runtimeLogger.log('runtime.exit', { code });
});

start();
