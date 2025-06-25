const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireRole(['admin', 'lead'])); // Sadece admin ve lead audit logları görebilir

// Listele (filtreli/pagination)
router.get('/', auditLogController.listAuditLogs);

// Detay
router.get('/:id', auditLogController.getAuditLogById);

// Kullanıcıya göre listele
router.get('/user/:userId', auditLogController.getAuditLogsByUser);

// Kaynağa göre listele
router.get('/resource/:resource/:resourceId', auditLogController.getAuditLogsByResource);

// Aksiyona göre listele
router.get('/action/:action', auditLogController.getAuditLogsByAction);

// İstatistikler
router.get('/statistics', auditLogController.getAuditStatistics);

// Başarısız aksiyonlar
router.get('/failed', auditLogController.getFailedActions);

// Yüksek önemli loglar
router.get('/high-severity', auditLogController.getHighSeverityLogs);

// Eski logları temizle (admin only)
router.delete('/clean', requireRole(['admin']), auditLogController.cleanOldLogs);

module.exports = router; 