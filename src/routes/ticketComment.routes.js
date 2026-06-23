const express = require('express');
const router = express.Router();

const {
    addComment,
    getComments
} = require('../controllers/ticketComment.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

router.post(
    '/:id/comments',
    authenticateToken,
    addComment
);

router.get(
    '/:id/comments',
    authenticateToken,
    getComments
);

module.exports = router;