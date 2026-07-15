const express = require('express');
const router = express.Router();

const {
    getTenants,
    getTenantById,
    createTenant,
    updateTenant,
    toggleTenantStatus,
    getTenantSummary
} = require('../controllers/tenant.controller');

const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireSuperAdmin } = require('../middlewares/tenant.middleware');

router.get('/', authenticateToken, requireSuperAdmin, getTenants);
router.get('/:id', authenticateToken, requireSuperAdmin, getTenantById);
router.post('/', authenticateToken, requireSuperAdmin, createTenant);
router.put('/:id', authenticateToken, requireSuperAdmin, updateTenant);
router.patch('/:id/status', authenticateToken, requireSuperAdmin, toggleTenantStatus);
router.get('/:id/summary', authenticateToken, requireSuperAdmin, getTenantSummary);

module.exports = router;
