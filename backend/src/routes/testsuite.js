const express = require('express');
const router = express.Router();
const testSuiteController = require('../controllers/testSuiteController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, testSuiteSchemas } = require('../middleware/validation');

router.use(authenticateToken);

// Listele (filtreli/pagination)
router.get('/', testSuiteController.listTestSuites);

// Detay
router.get('/:id', testSuiteController.getTestSuiteById);

// Oluştur
router.post('/', validate(testSuiteSchemas.create), testSuiteController.createTestSuite);

// Güncelle
router.put('/:id', validate(testSuiteSchemas.update), testSuiteController.updateTestSuite);

// Sil (soft delete)
router.delete('/:id', requireRole(['admin', 'lead', 'tester']), testSuiteController.deleteTestSuite);

// Arama
router.get('/search', testSuiteController.searchTestSuites);

// Modüle göre listele
router.get('/module/:module', testSuiteController.listByModule);

// Versiyona göre listele
router.get('/version/:version', testSuiteController.listByVersion);

// Platforma göre listele
router.get('/platform/:platform', testSuiteController.listByPlatform);

module.exports = router; 