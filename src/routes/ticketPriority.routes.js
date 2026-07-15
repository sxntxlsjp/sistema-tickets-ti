const express = require('express');
const router = express.Router();

const {
    getTicketPriorities,
    getActiveTicketPriorities,
    createTicketPriority,
    updateTicketPriority,
    toggleTicketPriorityStatus,
    deleteTicketPriority
} = require('../controllers/ticketPriority.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

// Prioridades activas para usuarios autenticados
router.get('/active', authenticateToken, resolveTenant, getActiveTicketPriorities);

// Administración de prioridades
router.get('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), getTicketPriorities);
router.post('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), createTicketPriority);
router.put('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), updateTicketPriority);
router.patch('/:id/status', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), toggleTicketPriorityStatus);
router.delete('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), deleteTicketPriority);

module.exports = router;
