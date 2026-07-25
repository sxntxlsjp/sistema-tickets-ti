const crypto = require('crypto');

// Identifica un único arranque del proceso. Cada reinicio (voluntario o por crash)
// genera un bootId distinto — es la evidencia que permite distinguir en los logs
// "el proceso sigue vivo" de "el proceso se reinició" (Sprint 20, Bloque E).
const bootId = crypto.randomUUID();
const pid = process.pid;

const SENSITIVE_PATTERNS = [
    /postgres(?:ql)?:\/\/[^\s"']+/gi,
    /Bearer\s+[A-Za-z0-9\-_.]+/gi,
    /sb_secret_[A-Za-z0-9_\-]+/gi,
    /sb_publishable_[A-Za-z0-9_\-]+/gi
];

// Nunca registrar DATABASE_URL, JWT_SECRET, claves Supabase, tokens, contraseñas,
// cuerpos de petición ni datos personales. Esta función es defensa adicional por si
// un mensaje de error de una librería externa llegara a incluir algo sensible.
const sanitizeMessage = (message) => {
    if (typeof message !== 'string') return message;

    return SENSITIVE_PATTERNS.reduce(
        (sanitized, pattern) => sanitized.replace(pattern, '[REDACTED]'),
        message
    );
};

const getMemorySnapshot = () => {
    const memory = process.memoryUsage();

    return {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
    };
};

const log = (event, extra = {}) => {
    const line = {
        event,
        bootId,
        pid,
        timestamp: new Date().toISOString(),
        ...extra
    };

    try {
        console.log(JSON.stringify(line));
    } catch (stringifyError) {
        // Evitar recursión o crash si el propio logger falla al serializar.
        console.log(JSON.stringify({
            event: 'runtime.log_failure',
            bootId,
            pid,
            timestamp: new Date().toISOString()
        }));
    }
};

const logError = (event, error, extra = {}) => {
    log(event, {
        ...extra,
        errorName: error?.name,
        errorMessage: sanitizeMessage(error?.message)
    });
};

const logRuntimeStart = () => {
    log('runtime.start', {
        ppid: process.ppid,
        startedAt: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: getMemorySnapshot()
    });
};

module.exports = {
    bootId,
    log,
    logError,
    sanitizeMessage,
    getMemorySnapshot,
    logRuntimeStart
};
