const express = require('express');
const router = express.Router();

const {
    getTicketSubtypes,
    getTicketSubtypesByType,
    getActiveTicketSubtypesByType,
    createTicketSubtype,
    updateTicketSubtype,
    toggleTicketSubtypeStatus,
    deleteTicketSubtype
} = require('../controllers/ticketSubtype.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

// ===== API para usuarios autenticados =====

// Obtener subtipos activos por tipo de ticket
router.get(
    '/active/:ticketTypeId',
    authenticateToken,
    resolveTenant,
    getActiveTicketSubtypesByType
);

// ===== Administración (TENANT_ADMIN) =====

// Listar todos los subtipos
router.get(
    '/',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getTicketSubtypes
);

// Listar subtipos de un tipo de ticket
router.get(
    '/type/:ticketTypeId',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getTicketSubtypesByType
);

// Crear subtipo
router.post(
    '/',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    createTicketSubtype
);

// Editar subtipo
router.put(
    '/:id',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    updateTicketSubtype
);

// Activar / desactivar subtipo
router.patch(
    '/:id/status',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    toggleTicketSubtypeStatus
);

// Eliminar subtipo
router.delete(
    '/:id',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    deleteTicketSubtype
);

module.exports = router;
