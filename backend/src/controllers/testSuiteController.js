const TestSuite = require('../models/TestSuite');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// List test suites with filters and pagination
const listTestSuites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, module, version, platform, category, status, assignedTo, createdBy, tags } = req.query;
  const filter = { isActive: true };
  if (module) filter.module = module;
  if (version) filter.version = version;
  if (platform) filter.platform = platform;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (createdBy) filter.createdBy = createdBy;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  const testSuites = await TestSuite.find(filter)
    .populate('createdBy', 'username')
    .populate('assignedTo', 'username')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await TestSuite.countDocuments(filter);
  res.json({ success: true, data: testSuites, total, page: Number(page), limit: Number(limit) });
});

// Get test suite by ID
const getTestSuiteById = asyncHandler(async (req, res) => {
  const testSuite = await TestSuite.findById(req.params.id)
    .populate('createdBy', 'username')
    .populate('assignedTo', 'username')
    .populate({
      path: 'testCases',
      select: 'title status priority assignedTo createdAt',
      populate: { path: 'assignedTo', select: 'username' }
    });
  if (!testSuite || !testSuite.isActive) {
    return res.status(404).json({ success: false, message: 'Test suite not found' });
  }
  res.json({ success: true, data: testSuite });
});

// Create test suite
const createTestSuite = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  const testSuite = await TestSuite.create(data);
  await AuditLog.logUserAction(req.user._id, 'create', 'testsuite', testSuite._id, { after: testSuite });
  res.status(201).json({ success: true, data: testSuite });
});

// Update test suite
const updateTestSuite = asyncHandler(async (req, res) => {
  const testSuite = await TestSuite.findById(req.params.id);
  if (!testSuite || !testSuite.isActive) {
    return res.status(404).json({ success: false, message: 'Test suite not found' });
  }
  const before = { ...testSuite.toObject() };
  Object.assign(testSuite, req.body, { lastModifiedBy: req.user._id });
  await testSuite.save();
  await AuditLog.logUserAction(req.user._id, 'update', 'testsuite', testSuite._id, { before, after: testSuite });
  res.json({ success: true, data: testSuite });
});

// Delete test suite (soft delete)
const deleteTestSuite = asyncHandler(async (req, res) => {
  const testSuite = await TestSuite.findById(req.params.id);
  if (!testSuite || !testSuite.isActive) {
    return res.status(404).json({ success: false, message: 'Test suite not found' });
  }
  testSuite.isActive = false;
  await testSuite.save();
  await AuditLog.logUserAction(req.user._id, 'delete', 'testsuite', testSuite._id, { before: testSuite });
  res.json({ success: true, message: 'Test suite deleted' });
});

// Search test suites
const searchTestSuites = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const suites = await TestSuite.searchSuites(search || '');
  res.json({ success: true, data: suites });
});

// List by module
const listByModule = asyncHandler(async (req, res) => {
  const { module } = req.params;
  const suites = await TestSuite.findByModule(module);
  res.json({ success: true, data: suites });
});

// List by version
const listByVersion = asyncHandler(async (req, res) => {
  const { version } = req.params;
  const suites = await TestSuite.findByVersion(version);
  res.json({ success: true, data: suites });
});

// List by platform
const listByPlatform = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const suites = await TestSuite.findByPlatform(platform);
  res.json({ success: true, data: suites });
});

module.exports = {
  listTestSuites,
  getTestSuiteById,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
  searchTestSuites,
  listByModule,
  listByVersion,
  listByPlatform
}; 