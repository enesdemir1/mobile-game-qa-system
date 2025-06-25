const TestStep = require('../models/TestStep');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// List test steps with filters and pagination
const listTestSteps = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category, priority, tags, isTemplate, createdBy } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
  if (createdBy) filter.createdBy = createdBy;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  const testSteps = await TestStep.find(filter)
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await TestStep.countDocuments(filter);
  res.json({ success: true, data: testSteps, total, page: Number(page), limit: Number(limit) });
});

// Get test step by ID
const getTestStepById = asyncHandler(async (req, res) => {
  const testStep = await TestStep.findById(req.params.id).populate('createdBy', 'username');
  if (!testStep || !testStep.isActive) {
    return res.status(404).json({ success: false, message: 'Test step not found' });
  }
  res.json({ success: true, data: testStep });
});

// Create test step
const createTestStep = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  const testStep = await TestStep.create(data);
  await AuditLog.logUserAction(req.user._id, 'create', 'teststep', testStep._id, { after: testStep });
  res.status(201).json({ success: true, data: testStep });
});

// Update test step
const updateTestStep = asyncHandler(async (req, res) => {
  const testStep = await TestStep.findById(req.params.id);
  if (!testStep || !testStep.isActive) {
    return res.status(404).json({ success: false, message: 'Test step not found' });
  }
  const before = { ...testStep.toObject() };
  Object.assign(testStep, req.body, { lastModifiedBy: req.user._id });
  await testStep.save();
  await AuditLog.logUserAction(req.user._id, 'update', 'teststep', testStep._id, { before, after: testStep });
  res.json({ success: true, data: testStep });
});

// Delete test step (soft delete)
const deleteTestStep = asyncHandler(async (req, res) => {
  const testStep = await TestStep.findById(req.params.id);
  if (!testStep || !testStep.isActive) {
    return res.status(404).json({ success: false, message: 'Test step not found' });
  }
  testStep.isActive = false;
  await testStep.save();
  await AuditLog.logUserAction(req.user._id, 'delete', 'teststep', testStep._id, { before: testStep });
  res.json({ success: true, message: 'Test step deleted' });
});

// List templates
const listTemplates = asyncHandler(async (req, res) => {
  const templates = await TestStep.find({ isTemplate: true, isActive: true }).sort({ templateName: 1 });
  res.json({ success: true, data: templates });
});

// Search test steps
const searchTestSteps = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const steps = await TestStep.searchSteps(search || '');
  res.json({ success: true, data: steps });
});

const uploadAttachmentToTestStep = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const testStep = await TestStep.findById(req.params.id);
    if (!testStep) {
      return res.status(404).json({ success: false, message: 'Test step not found' });
    }

    const attachment = {
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname
    };

    testStep.attachments.push(attachment);
    await testStep.save();

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      data: testStep
    });
  } catch (error) {
    logger.error(`Error uploading attachment: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while uploading file.' });
  }
};

module.exports = {
  listTestSteps,
  getTestStepById,
  createTestStep,
  updateTestStep,
  deleteTestStep,
  listTemplates,
  searchTestSteps,
  uploadAttachmentToTestStep
}; 