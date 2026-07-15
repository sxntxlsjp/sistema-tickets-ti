const express = require('express');
const router = express.Router();

const {
    getMyTickets,
    getAllTickets
} = require('../controllers/ticketList.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.get('/my', authenticateToken, resolveTenant, getMyTickets);

router.get(
    '/',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getAllTickets
);

module.exports = router;