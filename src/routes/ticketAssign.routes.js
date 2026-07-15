const express = require('express');
const router = express.Router();

const {
    assignTicket
} = require('../controllers/ticketAssign.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.put(
    '/:id/assign',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    assignTicket
);

module.exports = router;