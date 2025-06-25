const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Genel Raporlar
router.get('/', reportController.getGlobalReport);

module.exports = router; 