const express = require('express');
const router = express.Router();

const {
    getCountries,
    getActiveCountries,
    createCountry,
    updateCountry,
    deleteCountry
} = require('../controllers/country.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    resolveTenant,
    authorizeTenantRoles
} = require('../middlewares/tenant.middleware');

// Países activos para usuarios autenticados
router.get('/active', authenticateToken, getActiveCountries);

// Administración de países (rol de empresa, no rol global heredado)
router.get('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), getCountries);
router.post('/', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), createCountry);
router.put('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), updateCountry);
router.delete('/:id', authenticateToken, resolveTenant, authorizeTenantRoles('TENANT_ADMIN'), deleteCountry);

module.exports = router;