const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

router.use(authenticateToken);

// Listele (filtreli/pagination)
router.get('/', requireRole(['admin', 'lead']), userController.listUsers);

// Detay
router.get('/:id', requireRole(['admin', 'lead']), userController.getUserById);

// Oluştur (admin only)
router.post('/', requireRole(['admin']), validate(userSchemas.register), userController.createUser);

// Güncelle (admin only)
router.put('/:id', requireRole(['admin']), validate(userSchemas.update), userController.updateUser);

// Sil (soft delete, admin only)
router.delete('/:id', requireRole(['admin']), userController.deleteUser);

// Arama
router.get('/search', requireRole(['admin', 'lead']), userController.searchUsers);

module.exports = router; 