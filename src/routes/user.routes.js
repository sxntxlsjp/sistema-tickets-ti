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

const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.get(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    getAllUsers
);

router.get(
    '/support',
    authenticateToken,
    authorizeRoles('ADMIN', 'USER'),
    getSupportUsers
);

router.post(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    createUser
);
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('ADMIN'),
    updateUser
);

router.put(
    '/:id/reset-password',
    authenticateToken,
    authorizeRoles('ADMIN'),
    resetUserPassword
);

router.patch(
    '/:id/toggle-status',
    authenticateToken,
    authorizeRoles('ADMIN'),
    toggleUserStatus
);

module.exports = router;