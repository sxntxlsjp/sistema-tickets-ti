const express = require('express');
const router = express.Router();

const {
    getTicketPriorities,
    getActiveTicketPriorities,
    createTicketPriority,
    updateTicketPriority,
    toggleTicketPriorityStatus,
    deleteTicketPriority
} = require('../controllers/ticketPriority.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

// Prioridades activas para usuarios autenticados
router.get('/active', authenticateToken, getActiveTicketPriorities);

// Administración de prioridades
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getTicketPriorities);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createTicketPriority);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateTicketPriority);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), toggleTicketPriorityStatus);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteTicketPriority);

module.exports = router;