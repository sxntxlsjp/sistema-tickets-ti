const express = require('express');
const router = express.Router();

const {
    getTicketSubtypes,
    getTicketSubtypesByType,
    getActiveTicketSubtypesByType,
    createTicketSubtype,
    updateTicketSubtype,
    toggleTicketSubtypeStatus,
    deleteTicketSubtype
} = require('../controllers/ticketSubtype.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middlewares/auth.middleware');

// ===== API para usuarios autenticados =====

// Obtener subtipos activos por tipo de ticket
router.get(
    '/active/:ticketTypeId',
    authenticateToken,
    getActiveTicketSubtypesByType
);

// ===== Administración (ADMIN) =====

// Listar todos los subtipos
router.get(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getTicketSubtypes
);

// Listar subtipos de un tipo de ticket
router.get(
    '/type/:ticketTypeId',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getTicketSubtypesByType
);

// Crear subtipo
router.post(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    createTicketSubtype
);

// Editar subtipo
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('ADMIN'),
    updateTicketSubtype
);

// Activar / desactivar subtipo
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('ADMIN'),
    toggleTicketSubtypeStatus
);

// Eliminar subtipo
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('ADMIN'),
    deleteTicketSubtype
);

module.exports = router;