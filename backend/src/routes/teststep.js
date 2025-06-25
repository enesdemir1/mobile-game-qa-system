const express = require('express');
const router = express.Router();
const testStepController = require('../controllers/testStepController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, testStepSchemas } = require('../middleware/validation');
const { upload } = require('../services/uploadService');

router.use(authenticateToken);

// Listele (filtreli/pagination)
router.get('/', testStepController.listTestSteps);

// Detay
router.get('/:id', testStepController.getTestStepById);

// Oluştur
router.post('/', validate(testStepSchemas.create), requireRole(['admin', 'tester']), testStepController.createTestStep);

// Güncelle
router.put('/:id', validate(testStepSchemas.update), requireRole(['admin', 'tester']), testStepController.updateTestStep);

// Sil (soft delete)
router.delete('/:id', requireRole(['admin', 'tester']), testStepController.deleteTestStep);

// Şablonları listele
router.get('/templates/list', testStepController.listTemplates);

// Arama
router.get('/search', testStepController.searchTestSteps);

// Route for uploading an attachment to a specific test step
router.post(
  '/:id/upload',
  requireRole(['admin', 'tester']),
  upload.single('attachment'),
  testStepController.uploadAttachmentToTestStep
);

module.exports = router; 