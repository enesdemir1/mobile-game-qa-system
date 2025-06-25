const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'other'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const testStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test step title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Test step description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  expectedResult: {
    type: String,
    required: [true, 'Expected result is required'],
    trim: true,
    maxlength: [500, 'Expected result cannot exceed 500 characters']
  },
  stepNumber: {
    type: Number,
    required: true,
    min: 1
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    enum: ['functional', 'ui', 'performance', 'security', 'compatibility', 'regression', 'smoke', 'other'],
    default: 'functional'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    min: 1,
    default: 5
  },
  attachments: [attachmentSchema],
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  usageCount: {
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
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  status: { type: String, enum: ['Not Started', 'Pass', 'Fail', 'Block', 'In Progress'], default: 'Not Started' },
  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  executionDate: { type: Date },
  attachments: [{
    filename: String,
    path: String,
    originalName: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
testStepSchema.index({ title: 'text', description: 'text', tags: 'text' });
testStepSchema.index({ category: 1 });
testStepSchema.index({ priority: 1 });
testStepSchema.index({ tags: 1 });
testStepSchema.index({ isTemplate: 1 });
testStepSchema.index({ isActive: 1 });
testStepSchema.index({ createdBy: 1 });

// Virtual for full step info
testStepSchema.virtual('fullStepInfo').get(function() {
  return `${this.stepNumber}. ${this.title} - ${this.description}`;
});

// Pre-save middleware to update version
testStepSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version += 1;
  }
  next();
});

// Method to increment usage count
testStepSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return await this.save();
};

// Method to create a copy for template
testStepSchema.methods.createTemplate = function(templateName) {
  const template = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    isTemplate: true,
    templateName,
    usageCount: 0,
    version: 1
  });
  delete template.createdAt;
  delete template.updatedAt;
  return template;
};

// Static method to find templates
testStepSchema.statics.findTemplates = function() {
  return this.find({ isTemplate: true, isActive: true }).sort({ templateName: 1 });
};

// Static method to find by category
testStepSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ stepNumber: 1 });
};

// Static method to search steps
testStepSchema.statics.searchSteps = function(searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  }).sort({ title: 1 });
};

module.exports = mongoose.model('TestStep', testStepSchema); 