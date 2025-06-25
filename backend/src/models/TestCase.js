const mongoose = require('mongoose');

const stepExecutionSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestStep',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'passed', 'failed', 'blocked', 'skipped'],
    default: 'not_started'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  logs: [{
    message: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'debug'],
      default: 'info'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
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
    }]
  }],
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const testCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test case title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Test case description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  suiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSuite',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  buildVersion: {
    type: String,
    required: [true, 'Build version is required'],
    trim: true,
    maxlength: [20, 'Build version cannot exceed 20 characters']
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
  deviceInfo: {
    deviceModel: {
      type: String,
      trim: true,
      maxlength: [100, 'Device model cannot exceed 100 characters']
    },
    osVersion: {
      type: String,
      trim: true,
      maxlength: [20, 'OS version cannot exceed 20 characters']
    },
    screenResolution: {
      type: String,
      trim: true,
      maxlength: [20, 'Screen resolution cannot exceed 20 characters']
    },
    networkType: {
      type: String,
      enum: ['wifi', '4g', '3g', '2g', 'offline'],
      default: 'wifi'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
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
  status: {
    type: String,
    enum: ['draft', 'ready', 'in_progress', 'completed', 'blocked', 'failed', 'passed'],
    default: 'draft'
  },
  stepRefs: [stepExecutionSchema],
  estimatedTime: {
    type: Number, // in minutes
    min: 1,
    default: 10
  },
  actualTime: {
    type: Number, // in minutes
    min: 0,
    default: 0
  },
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  bugReferences: [{
    bugId: {
      type: String,
      required: true,
      trim: true
    },
    bugSystem: {
      type: String,
      enum: ['jira', 'trello', 'github', 'other'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    }
  }],
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationScript: {
    type: String,
    trim: true,
    maxlength: [500, 'Automation script cannot exceed 500 characters']
  },
  lastExecutedAt: {
    type: Date,
    default: null
  },
  executionCount: {
    type: Number,
    default: 0
  },
  passRate: {
    type: Number,
    min: 0,
    max: 100,
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
testCaseSchema.index({ title: 'text', description: 'text' });
testCaseSchema.index({ suiteId: 1 });
testCaseSchema.index({ assignedTo: 1 });
testCaseSchema.index({ buildVersion: 1 });
testCaseSchema.index({ platform: 1 });
testCaseSchema.index({ status: 1 });
testCaseSchema.index({ category: 1 });
testCaseSchema.index({ priority: 1 });
testCaseSchema.index({ isActive: 1 });
testCaseSchema.index({ createdBy: 1 });
testCaseSchema.index({ tags: 1 });
testCaseSchema.index({ lastExecutedAt: -1 });

// Virtual for progress percentage
testCaseSchema.virtual('progressPercentage').get(function() {
  if (!this.stepRefs || this.stepRefs.length === 0) return 0;
  
  const completedSteps = this.stepRefs.filter(step => 
    ['passed', 'failed', 'blocked', 'skipped'].includes(step.status)
  ).length;
  
  return Math.round((completedSteps / this.stepRefs.length) * 100);
});

// Virtual for test case info
testCaseSchema.virtual('testCaseInfo').get(function() {
  return `${this.title} (${this.buildVersion} - ${this.platform})`;
});

// Pre-save middleware to update version and calculate pass rate
testCaseSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version += 1;
  }
  
  // Calculate pass rate
  if (this.stepRefs && this.stepRefs.length > 0) {
    const passedSteps = this.stepRefs.filter(step => step.status === 'passed').length;
    this.passRate = Math.round((passedSteps / this.stepRefs.length) * 100);
  }
  
  next();
});

// Method to add step execution
testCaseSchema.methods.addStepExecution = async function(stepId, status, notes = '', executedBy = null) {
  const stepExecution = {
    stepId,
    status,
    notes,
    executedBy,
    startedAt: new Date()
  };
  
  this.stepRefs.push(stepExecution);
  return await this.save();
};

// Method to update step status
testCaseSchema.methods.updateStepStatus = async function(stepId, status, notes = '') {
  const step = this.stepRefs.find(s => s.stepId.toString() === stepId.toString());
  if (step) {
    step.status = status;
    step.notes = notes;
    
    if (status === 'in_progress' && !step.startedAt) {
      step.startedAt = new Date();
    } else if (['passed', 'failed', 'blocked', 'skipped'].includes(status)) {
      step.completedAt = new Date();
      if (step.startedAt) {
        step.duration = Math.round((step.completedAt - step.startedAt) / 1000);
      }
    }
    
    return await this.save();
  }
  return null;
};

// Method to add log to step
testCaseSchema.methods.addStepLog = async function(stepId, message, level = 'info', attachments = []) {
  const step = this.stepRefs.find(s => s.stepId.toString() === stepId.toString());
  if (step) {
    step.logs.push({
      message,
      level,
      timestamp: new Date(),
      attachments
    });
    return await this.save();
  }
  return null;
};

// Method to start execution
testCaseSchema.methods.startExecution = async function() {
  this.status = 'in_progress';
  this.lastExecutedAt = new Date();
  this.executionCount += 1;
  return await this.save();
};

// Method to complete execution
testCaseSchema.methods.completeExecution = async function(finalStatus) {
  this.status = finalStatus;
  this.actualTime = this.calculateActualTime();
  return await this.save();
};

// Method to calculate actual time
testCaseSchema.methods.calculateActualTime = function() {
  if (!this.stepRefs || this.stepRefs.length === 0) return 0;
  
  const totalDuration = this.stepRefs.reduce((total, step) => {
    return total + (step.duration || 0);
  }, 0);
  
  return Math.round(totalDuration / 60); // Convert to minutes
};

// Static method to find by suite
testCaseSchema.statics.findBySuite = function(suiteId) {
  return this.find({ suiteId, isActive: true }).sort({ priority: -1, title: 1 });
};

// Static method to find by status
testCaseSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true }).sort({ lastExecutedAt: -1, title: 1 });
};

// Static method to find by assigned user
testCaseSchema.statics.findByAssignedUser = function(userId) {
  return this.find({ assignedTo: userId, isActive: true }).sort({ priority: -1, title: 1 });
};

// Static method to find by build version
testCaseSchema.statics.findByBuildVersion = function(buildVersion) {
  return this.find({ buildVersion, isActive: true }).sort({ status: 1, title: 1 });
};

// Static method to search test cases
testCaseSchema.statics.searchTestCases = function(searchTerm) {
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
  }).sort({ priority: -1, title: 1 });
};

module.exports = mongoose.model('TestCase', testCaseSchema); 