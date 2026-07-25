const express = require('express');
const router = express.Router();

const {
    getLiveness,
    getReadiness,
    getDatabaseHealth
} = require('../controllers/health.controller');

router.get('/', getLiveness);
router.get('/ready', getReadiness);
router.get('/database', getDatabaseHealth);

module.exports = router;
