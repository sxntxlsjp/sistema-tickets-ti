const express = require('express');
const router = express.Router();

const {
    getTicketTypes,
    getActiveTicketTypes,
    createTicketType,
    updateTicketType,
    toggleTicketTypeStatus,
    deleteTicketType
} = require('../controllers/ticketType.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

// Tipos activos para usuarios autenticados
router.get('/active', authenticateToken, getActiveTicketTypes);

// Administración de tipos de ticket
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getTicketTypes);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createTicketType);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateTicketType);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), toggleTicketTypeStatus);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteTicketType);

module.exports = router;