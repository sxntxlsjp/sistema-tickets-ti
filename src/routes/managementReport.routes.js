const express = require('express');
const router = express.Router();

const {
    generateManagementReport
} = require('../controllers/managementReport.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.get(
    '/management-report',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    generateManagementReport
);

module.exports = router;
