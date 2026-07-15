const express = require('express');
const router = express.Router();

const {
    addComment,
    getComments
} = require('../controllers/ticketComment.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');
const { resolveTenant } = require('../middlewares/tenant.middleware');

router.post(
    '/:id/comments',
    authenticateToken,
    resolveTenant,
    addComment
);

router.get(
    '/:id/comments',
    authenticateToken,
    resolveTenant,
    getComments
);

module.exports = router;