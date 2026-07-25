const prisma = require('../config/prisma');
const runtimeLogger = require('../utils/runtimeLogger.util');
const { version: APP_VERSION } = require('../../package.json');

const HEALTH_DB_TIMEOUT_MS = 3000;

// Liviano a propósito: no toca Prisma ni expone pid/bootId/host/rutas/variables.
const getHealth = (req, res) => {
    return res.json({
        ok: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: APP_VERSION
    });
};

const getDatabaseHealth = async (req, res) => {
    const startedAt = Date.now();

    let timeoutHandle;

    const timeout = new Promise((_, reject) => {
        timeoutHandle = setTimeout(
            () => reject(new Error('database health check timeout')),
            HEALTH_DB_TIMEOUT_MS
        );
    });

    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            timeout
        ]);

        clearTimeout(timeoutHandle);

        return res.json({
            ok: true,
            status: 'healthy',
            latencyMs: Date.now() - startedAt,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        clearTimeout(timeoutHandle);

        runtimeLogger.logError('health.database_check_failed', error);

        return res.status(503).json({
            ok: false,
            status: 'degraded',
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getHealth,
    getDatabaseHealth
};
