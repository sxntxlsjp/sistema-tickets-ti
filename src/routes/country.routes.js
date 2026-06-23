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
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

// Países activos para usuarios autenticados
router.get('/active', authenticateToken, getActiveCountries);

// Administración de países
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getCountries);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createCountry);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateCountry);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteCountry);

module.exports = router;