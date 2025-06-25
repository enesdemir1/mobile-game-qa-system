const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// List users with filters and pagination
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }
  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(filter);
  res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

// Create user (admin only)
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, role, isActive, permissions } = req.body;
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
  }
  const user = await User.create({ username, email, password, firstName, lastName, role, isActive, permissions });
  await AuditLog.logUserAction(req.user._id, 'create', 'user', user._id, { after: user });
  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// Update user (admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const before = { ...user.toObject() };
  Object.assign(user, req.body);
  await user.save();
  await AuditLog.logUserAction(req.user._id, 'update', 'user', user._id, { before, after: user });
  res.json({ success: true, data: user.toSafeObject() });
});

// Delete user (soft delete, admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  user.isActive = false;
  await user.save();
  await AuditLog.logUserAction(req.user._id, 'delete', 'user', user._id, { before: user });
  res.json({ success: true, message: 'User deleted' });
});

// Search users
const searchUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const users = await User.find({
    $or: [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ]
  }).select('-password -refreshToken');
  res.json({ success: true, data: users });
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers
}; 