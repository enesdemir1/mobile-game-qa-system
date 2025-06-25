const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User with this email or username already exists'
    });
  }

  // Create user with only provided fields
  const userData = { username, email, password, role: role || 'tester' };
  const user = await User.create(userData);

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Log the registration
  await AuditLog.logUserAction(
    user._id,
    'create',
    'user',
    user._id,
    {
      after: user.toSafeObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toSafeObject(),
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update user's last login and refresh token
  user.lastLogin = new Date();
  user.refreshToken = refreshToken;
  await user.save();

  // Log the login
  await AuditLog.logUserAction(
    user._id,
    'login',
    'user',
    user._id,
    {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toSafeObject(),
      token,
      refreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Clear refresh token
  await User.findByIdAndUpdate(userId, {
    refreshToken: null
  });

  // Log the logout
  await AuditLog.logUserAction(
    userId,
    'logout',
    'user',
    userId,
    {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  );

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user exists and has the same refresh token
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: user.toSafeObject()
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (avatar) user.avatar = avatar;

  await user.save();

  // Log the profile update
  await AuditLog.logUserAction(
    userId,
    'update',
    'user',
    userId,
    {
      before: req.originalBody,
      after: user.toSafeObject(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toSafeObject()
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log the password change
  await AuditLog.logUserAction(
    userId,
    'update',
    'user',
    userId,
    {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: new Map([['action', 'password_change']])
    }
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate reset token (in a real app, you'd send this via email)
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Log the forgot password request
  await AuditLog.logUserAction(
    user._id,
    'update',
    'user',
    user._id,
    {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: new Map([['action', 'forgot_password']])
    }
  );

  res.json({
    success: true,
    message: 'Password reset instructions sent to your email',
    data: {
      resetToken // In production, this would be sent via email
    }
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log the password reset
    await AuditLog.logUserAction(
      user._id,
      'update',
      'user',
      user._id,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: new Map([['action', 'password_reset']])
      }
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid reset token'
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
}; 