const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

// Public routes
router.post('/register', validate(userSchemas.register), register);
router.post('/login', validate(userSchemas.login), login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authenticateToken);
router.get('/me', getCurrentUser);
router.put('/profile', validate(userSchemas.update), updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router; 