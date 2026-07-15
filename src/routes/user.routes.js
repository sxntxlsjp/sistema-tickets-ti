const express = require('express');
const router = express.Router();

const {
    getSupportUsers,
    createUser,
    getAllUsers,
    updateUser,
    resetUserPassword,
    toggleUserStatus
} = require('../controllers/user.controller');

const { authenticateToken } = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

router.get(
    '/',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    getAllUsers
);

router.get(
    '/support',
    authenticateToken,
    resolveTenant,
    getSupportUsers
);

router.post(
    '/',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    createUser
);
router.put(
    '/:id',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    updateUser
);

router.put(
    '/:id/reset-password',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    resetUserPassword
);

router.patch(
    '/:id/toggle-status',
    authenticateToken,
    resolveTenant,
    authorizeTenantRoles('TENANT_ADMIN'),
    toggleUserStatus
);

module.exports = router;
