const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// List audit logs with filters and pagination
const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, user, action, resource, resourceId, severity, isSuccessful, startDate, endDate } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (resourceId) filter.resourceId = resourceId;
  if (severity) filter.severity = severity;
  if (isSuccessful !== undefined) filter.isSuccessful = isSuccessful === 'true';
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const auditLogs = await AuditLog.find(filter)
    .populate('user', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await AuditLog.countDocuments(filter);
  res.json({ success: true, data: auditLogs, total, page: Number(page), limit: Number(limit) });
});

// Get audit log by ID
const getAuditLogById = asyncHandler(async (req, res) => {
  const auditLog = await AuditLog.findById(req.params.id).populate('user', 'username firstName lastName');
  if (!auditLog) {
    return res.status(404).json({ success: false, message: 'Audit log not found' });
  }
  res.json({ success: true, data: auditLog });
});

// Get audit logs by user
const getAuditLogsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  const auditLogs = await AuditLog.findByUser(userId, Number(limit));
  res.json({ success: true, data: auditLogs });
});

// Get audit logs by resource
const getAuditLogsByResource = asyncHandler(async (req, res) => {
  const { resource, resourceId } = req.params;
  const { limit = 50 } = req.query;
  const auditLogs = await AuditLog.findByResource(resource, resourceId, Number(limit));
  res.json({ success: true, data: auditLogs });
});

// Get audit logs by action
const getAuditLogsByAction = asyncHandler(async (req, res) => {
  const { action } = req.params;
  const { limit = 50 } = req.query;
  const auditLogs = await AuditLog.findByAction(action, Number(limit));
  res.json({ success: true, data: auditLogs });
});

// Get audit statistics
const getAuditStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate ? new Date(endDate) : new Date();
  const statistics = await AuditLog.getAuditStatistics(start, end);
  res.json({ success: true, data: statistics });
});

// Get failed actions
const getFailedActions = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const failedActions = await AuditLog.findFailedActions(Number(limit));
  res.json({ success: true, data: failedActions });
});

// Get high severity logs
const getHighSeverityLogs = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const highSeverityLogs = await AuditLog.findHighSeverityLogs(Number(limit));
  res.json({ success: true, data: highSeverityLogs });
});

// Clean old logs (admin only)
const cleanOldLogs = asyncHandler(async (req, res) => {
  const { daysToKeep = 90 } = req.query;
  const deletedCount = await AuditLog.cleanOldLogs(Number(daysToKeep));
  res.json({ success: true, message: `${deletedCount} old audit logs cleaned` });
});

module.exports = {
  listAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditLogsByResource,
  getAuditLogsByAction,
  getAuditStatistics,
  getFailedActions,
  getHighSeverityLogs,
  cleanOldLogs
}; 