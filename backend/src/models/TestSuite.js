const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test suite title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Test suite description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  module: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
    maxlength: [100, 'Module name cannot exceed 100 characters']
  },
  version: {
    type: String,
    required: [true, 'Version is required'],
    trim: true,
    maxlength: [20, 'Version cannot exceed 20 characters']
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'both', 'web', 'desktop'],
    required: true
  },
  gameMode: {
    type: String,
    trim: true,
    maxlength: [100, 'Game mode cannot exceed 100 characters']
  },
  category: {
    type: String,
    enum: ['regression', 'smoke', 'functional', 'performance', 'security', 'compatibility', 'user_acceptance', 'other'],
    default: 'functional'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: 1,
    default: 60
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  testCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase'
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'deprecated'],
    default: 'draft'
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationFramework: {
    type: String,
    trim: true,
    maxlength: [100, 'Automation framework cannot exceed 100 characters']
  },
  executionOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
testSuiteSchema.index({ title: 'text', description: 'text', module: 'text' });
testSuiteSchema.index({ module: 1 });
testSuiteSchema.index({ version: 1 });
testSuiteSchema.index({ platform: 1 });
testSuiteSchema.index({ category: 1 });
testSuiteSchema.index({ status: 1 });
testSuiteSchema.index({ isActive: 1 });
testSuiteSchema.index({ createdBy: 1 });
testSuiteSchema.index({ assignedTo: 1 });
testSuiteSchema.index({ tags: 1 });

// Virtual for test case count
testSuiteSchema.virtual('testCaseCount').get(function() {
  return this.testCases ? this.testCases.length : 0;
});

// Virtual for suite info
testSuiteSchema.virtual('suiteInfo').get(function() {
  return `${this.module} - ${this.title} (v${this.version})`;
});

// Pre-save middleware to validate test cases
testSuiteSchema.pre('save', function(next) {
  if (this.testCases && this.testCases.length > 0) {
    // Remove duplicates
    this.testCases = [...new Set(this.testCases)];
  }
  next();
});

// Method to add test case
testSuiteSchema.methods.addTestCase = async function(testCaseId) {
  if (!this.testCases.includes(testCaseId)) {
    this.testCases.push(testCaseId);
    return await this.save();
  }
  return this;
};

// Method to remove test case
testSuiteSchema.methods.removeTestCase = async function(testCaseId) {
  this.testCases = this.testCases.filter(id => id.toString() !== testCaseId.toString());
  return await this.save();
};

// Method to get test cases with details
testSuiteSchema.methods.getTestCasesWithDetails = async function() {
  await this.populate({
    path: 'testCases',
    select: 'title status priority assignedTo createdAt',
    populate: {
      path: 'assignedTo',
      select: 'firstName lastName username'
    }
  });
  return this.testCases;
};

// Static method to find by module
testSuiteSchema.statics.findByModule = function(module) {
  return this.find({ module, isActive: true }).sort({ executionOrder: 1, title: 1 });
};

// Static method to find by version
testSuiteSchema.statics.findByVersion = function(version) {
  return this.find({ version, isActive: true }).sort({ module: 1, title: 1 });
};

// Static method to find by platform
testSuiteSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform, isActive: true }).sort({ module: 1, title: 1 });
};

// Static method to find by category
testSuiteSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ priority: -1, title: 1 });
};

// Static method to search suites
testSuiteSchema.statics.searchSuites = function(searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { module: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  }).sort({ module: 1, title: 1 });
};

module.exports = mongoose.model('TestSuite', testSuiteSchema); 