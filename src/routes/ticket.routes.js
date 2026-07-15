const express = require('express');
const router = express.Router();

const {
    createTicket,
    takeTicket,
    assignTicketPriority
} = require('../controllers/ticket.controller');
const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.post('/', authenticateToken, resolveTenant, createTicket);
router.put(
    '/:id/take',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    takeTicket
);
router.patch(
    '/:id/priority',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    assignTicketPriority
);
module.exports = router;