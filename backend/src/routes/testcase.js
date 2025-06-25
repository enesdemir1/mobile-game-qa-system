const express = require('express');
const router = express.Router();
const testCaseController = require('../controllers/testCaseController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, testCaseSchemas, querySchemas } = require('../middleware/validation');

// Tüm endpointler için authentication zorunlu
router.use(authenticateToken);

// Listele (filtreli/pagination)
router.get('/', testCaseController.listTestCases);

// Detay
router.get('/:id', testCaseController.getTestCaseById);

// Oluştur
router.post('/', validate(testCaseSchemas.create), testCaseController.createTestCase);

// Güncelle
router.put('/:id', validate(testCaseSchemas.update), testCaseController.updateTestCase);

// Sil (soft delete)
router.delete('/:id', requireRole(['admin', 'lead', 'tester']), testCaseController.deleteTestCase);

// Test adımı durumu güncelle
router.patch('/:id/steps/:stepId', validate(testCaseSchemas.updateStepStatus), testCaseController.updateStepStatus);

// Test adımına log ekle
router.post('/:id/steps/:stepId/logs', validate(testCaseSchemas.addStepLog), testCaseController.addStepLog);

// Test case yürütmesini başlat
router.post('/:id/start', testCaseController.startExecution);

// Test case yürütmesini tamamla
router.post('/:id/complete', testCaseController.completeExecution);

module.exports = router; 