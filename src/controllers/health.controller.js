const readinessService = require('../services/readiness.service');
const { version: APP_VERSION } = require('../../package.json');

// Liviano a propósito: no toca Prisma ni expone pid/bootId/host/rutas/variables.
// Debe responder 200 mientras Express esté vivo, incluso con la DB degradada —
// Hostinger usa esto para decidir si el proceso sigue vivo, no si está listo.
const getLiveness = (req, res) => {
    return res.json({
        ok: true,
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: APP_VERSION
    });
};

// Lee el estado ya calculado por el readiness service (Sprint 21, Fase 6/7) — no
// dispara una consulta nueva en cada request de readiness.
const getReadiness = (req, res) => {
    const state = readinessService.getState();

    if (!state.databaseReady) {
        return res.status(503).json({
            ok: false,
            status: 'not_ready',
            database: 'degraded',
            timestamp: new Date().toISOString()
        });
    }

    return res.json({
        ok: true,
        status: 'ready',
        database: 'healthy',
        timestamp: new Date().toISOString()
    });
};

// Comprobación activa bajo demanda. Reutiliza el mismo mecanismo de single-flight del
// readiness service: si ya hay un check en curso (programado o de otro caller), esta
// solicitud espera esa misma promesa en vez de disparar una segunda consulta.
const getDatabaseHealth = async (req, res) => {
    const startedAt = Date.now();

    const isHealthy = await readinessService.performCheck();
    const state = readinessService.getState();

    if (!isHealthy) {
        return res.status(503).json({
            ok: false,
            status: 'degraded',
            timestamp: new Date().toISOString()
        });
    }

    return res.json({
        ok: true,
        status: 'healthy',
        latencyMs: state.lastLatencyMs ?? (Date.now() - startedAt),
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    getLiveness,
    getReadiness,
    getDatabaseHealth
};
