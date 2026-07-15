const express = require('express');
const router = express.Router();

const {
    getSystemSettings,
    getSystemSettingByKey,
    createSystemSetting,
    updateSystemSetting,
    updateSystemSettingValueByKey
} = require('../controllers/systemSetting.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant, authorizeTenantRoles } = require('../middlewares/tenant.middleware');

// Consultas de configuraciones
router.get('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), getSystemSettings);
router.get('/:key', authenticateToken, resolveTenant, getSystemSettingByKey);

// Administración de configuraciones
router.post('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), createSystemSetting);
router.put('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), updateSystemSetting);
router.patch('/:key/value', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), updateSystemSettingValueByKey);

module.exports = router;
