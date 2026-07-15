const express = require('express');
const router = express.Router();

const {
    getDashboardSummary,
    getMyAdminAlerts
} = require('../controllers/dashboard.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.get(
    '/summary',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getDashboardSummary
);
router.get(
    '/my-alerts',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getMyAdminAlerts
);
module.exports = router;