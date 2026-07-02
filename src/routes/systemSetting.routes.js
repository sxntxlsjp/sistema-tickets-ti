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
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

// Consultas de configuraciones
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getSystemSettings);
router.get('/:key', authenticateToken, getSystemSettingByKey);

// Administración de configuraciones
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createSystemSetting);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateSystemSetting);
router.patch('/:key/value', authenticateToken, authorizeRoles('ADMIN'), updateSystemSettingValueByKey);

module.exports = router;