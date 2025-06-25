const TestCase = require('../models/TestCase');
const TestSuite = require('../models/TestSuite');
const TestStep = require('../models/TestStep');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// List test cases with filters and pagination
const listTestCases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, suiteId, platform, buildVersion, category, status, assignedTo, createdBy, tags } = req.query;
  const filter = { isActive: true };
  if (suiteId) filter.suiteId = suiteId;
  if (platform) filter.platform = platform;
  if (buildVersion) filter.buildVersion = buildVersion;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (createdBy) filter.createdBy = createdBy;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  const testCases = await TestCase.find(filter)
    .populate('assignedTo', 'username firstName lastName')
    .populate('createdBy', 'username')
    .populate('suiteId', 'title')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await TestCase.countDocuments(filter);
  res.json({ success: true, data: testCases, total, page: Number(page), limit: Number(limit) });
});

// Get test case by ID
const getTestCaseById = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findById(req.params.id)
    .populate('assignedTo', 'username firstName lastName')
    .populate('createdBy', 'username')
    .populate('suiteId', 'title')
    .populate('stepRefs.stepId');
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  res.json({ success: true, data: testCase });
});

// Create test case
const createTestCase = asyncHandler(async (req, res) => {
  const { title, description, suiteId, assignedTo, buildVersion, platform, gameMode, deviceInfo, tags, category, priority, estimatedTime, prerequisites, notes, isAutomated, automationScript, stepRefs } = req.body;
  const testCase = await TestCase.create({
    title,
    description,
    suiteId,
    assignedTo,
    buildVersion,
    platform,
    gameMode,
    deviceInfo,
    tags,
    category,
    priority,
    estimatedTime,
    prerequisites,
    notes,
    isAutomated,
    automationScript,
    stepRefs: (stepRefs || []).map(stepId => ({ stepId })),
    createdBy: req.user._id
  });
  await AuditLog.logUserAction(req.user._id, 'create', 'testcase', testCase._id, { after: testCase });
  res.status(201).json({ success: true, data: testCase });
});

// Update test case
const updateTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  const before = { ...testCase.toObject() };
  Object.assign(testCase, req.body, { lastModifiedBy: req.user._id });
  await testCase.save();
  await AuditLog.logUserAction(req.user._id, 'update', 'testcase', testCase._id, { before, after: testCase });
  res.json({ success: true, data: testCase });
});

// Delete test case (soft delete)
const deleteTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  testCase.isActive = false;
  await testCase.save();
  await AuditLog.logUserAction(req.user._id, 'delete', 'testcase', testCase._id, { before: testCase });
  res.json({ success: true, message: 'Test case deleted' });
});

// Update step status and log
const updateStepStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  const updated = await testCase.updateStepStatus(req.params.stepId, status, notes);
  await AuditLog.logUserAction(req.user._id, 'update', 'testcase', testCase._id, { after: updated });
  res.json({ success: true, data: updated });
});

// Add log to step
const addStepLog = asyncHandler(async (req, res) => {
  const { message, level, attachments } = req.body;
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  const updated = await testCase.addStepLog(req.params.stepId, message, level, attachments);
  await AuditLog.logUserAction(req.user._id, 'update', 'testcase', testCase._id, { after: updated });
  res.json({ success: true, data: updated });
});

// Start execution
const startExecution = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  const updated = await testCase.startExecution();
  await AuditLog.logUserAction(req.user._id, 'update', 'testcase', testCase._id, { after: updated });
  res.json({ success: true, data: updated });
});

// Complete execution
const completeExecution = asyncHandler(async (req, res) => {
  const { finalStatus } = req.body;
  const testCase = await TestCase.findById(req.params.id);
  if (!testCase || !testCase.isActive) {
    return res.status(404).json({ success: false, message: 'Test case not found' });
  }
  const updated = await testCase.completeExecution(finalStatus);
  await AuditLog.logUserAction(req.user._id, 'update', 'testcase', testCase._id, { after: updated });
  res.json({ success: true, data: updated });
});

module.exports = {
  listTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  updateStepStatus,
  addStepLog,
  startExecution,
  completeExecution
}; 