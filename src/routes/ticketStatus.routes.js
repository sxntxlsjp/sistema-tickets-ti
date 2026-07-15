const express = require('express');
const router = express.Router();

const { updateTicketStatus } = require('../controllers/ticketStatus.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.put(
    '/:id/status',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN', 'AGENT'),
    updateTicketStatus
);

module.exports = router;