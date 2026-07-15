const express = require('express');
const router = express.Router();

const {
    getTicketTypes,
    getActiveTicketTypes,
    createTicketType,
    updateTicketType,
    toggleTicketTypeStatus,
    deleteTicketType
} = require('../controllers/ticketType.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

// Tipos activos para usuarios autenticados
router.get('/active', authenticateToken, resolveTenant, getActiveTicketTypes);

// Administración de tipos de ticket
router.get('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), getTicketTypes);
router.post('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), createTicketType);
router.put('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), updateTicketType);
router.patch('/:id/status', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), toggleTicketTypeStatus);
router.delete('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), deleteTicketType);

module.exports = router;
