const express = require('express');
const router = express.Router();

const {
    getHealth,
    getDatabaseHealth
} = require('../controllers/health.controller');

router.get('/', getHealth);
router.get('/database', getDatabaseHealth);

module.exports = router;
