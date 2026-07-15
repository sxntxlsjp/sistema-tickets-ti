const express = require('express');
const router = express.Router();

const { login, me, getMyTenants } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.get('/me', authenticateToken, me);
router.get('/tenants', authenticateToken, getMyTenants);

module.exports = router;