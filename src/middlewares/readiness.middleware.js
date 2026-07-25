const readinessService = require('../services/readiness.service');

// Sprint 21, Fase 8. Se aplica antes de authenticateToken/resolveTenant a nivel de
// app.js (montado sobre /api, después de excluir explícitamente /api/health) para
// que ninguna ruta operativa intente hablar con Prisma mientras la DB no está lista.
// No reintenta la petición, no ejecuta un check por request: solo lee el estado ya
// mantenido por readiness.service.
const requireDatabaseReady = (req, res, next) => {
    const state = readinessService.getState();

    if (!state.databaseReady) {
        return res.status(503).json({
            message: 'El servicio se está preparando. Intenta nuevamente en unos segundos.'
        });
    }

    next();
};

module.exports = requireDatabaseReady;
