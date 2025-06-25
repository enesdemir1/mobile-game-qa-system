const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'export',
      'import',
      'status_change',
      'assignment_change',
      'file_upload',
      'file_delete',
      'permission_change',
      'role_change'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'user',
      'testcase',
      'teststep',
      'testsuite',
      'audit_log',
      'system'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Not required for system-level actions
  },
  resourceName: {
    type: String,
    required: false,
    maxlength: [200, 'Resource name cannot exceed 200 characters']
  },
  details: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    changes: [{
      field: {
        type: String,
        required: true
      },
      oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    }]
  },
  ipAddress: {
    type: String,
    required: false,
    maxlength: [45, 'IP address cannot exceed 45 characters']
  },
  userAgent: {
    type: String,
    required: false,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  sessionId: {
    type: String,
    required: false,
    maxlength: [100, 'Session ID cannot exceed 100 characters']
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  isSuccessful: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    required: false,
    maxlength: [500, 'Error message cannot exceed 500 characters']
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ isSuccessful: 1 });
auditLogSchema.index({ 'details.changes.field': 1 });

// Compound indexes for common queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Virtual for formatted action description
auditLogSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged in',
    logout: 'Logged out',
    export: 'Exported',
    import: 'Imported',
    status_change: 'Changed status',
    assignment_change: 'Changed assignment',
    file_upload: 'Uploaded file',
    file_delete: 'Deleted file',
    permission_change: 'Changed permissions',
    role_change: 'Changed role'
  };
  
  return actionMap[this.action] || this.action;
});

// Virtual for full description
auditLogSchema.virtual('fullDescription').get(function() {
  return `${this.actionDescription} ${this.resource}${this.resourceName ? `: ${this.resourceName}` : ''}`;
});

// Static method to log action
auditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    return await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

// Static method to log user action
auditLogSchema.statics.logUserAction = async function(userId, action, resource, resourceId = null, details = {}) {
  return await this.logAction({
    user: userId,
    action,
    resource,
    resourceId,
    details
  });
};

// Static method to log system action
auditLogSchema.statics.logSystemAction = async function(action, details = {}) {
  return await this.logAction({
    user: null, // System action
    action,
    resource: 'system',
    details
  });
};

// Static method to find by user
auditLogSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to find by resource
auditLogSchema.statics.findByResource = function(resource, resourceId, limit = 50) {
  return this.find({ resource, resourceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to find by action
auditLogSchema.statics.findByAction = function(action, limit = 50) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to find by date range
auditLogSchema.statics.findByDateRange = function(startDate, endDate, limit = 100) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to find failed actions
auditLogSchema.statics.findFailedActions = function(limit = 50) {
  return this.find({ isSuccessful: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to find high severity logs
auditLogSchema.statics.findHighSeverityLogs = function(limit = 50) {
  return this.find({ severity: { $in: ['high', 'critical'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username firstName lastName');
};

// Static method to get audit statistics
auditLogSchema.statics.getAuditStatistics = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        successfulCount: {
          $sum: { $cond: ['$isSuccessful', 1, 0] }
        },
        failedCount: {
          $sum: { $cond: ['$isSuccessful', 0, 1] }
        },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to clean old logs
auditLogSchema.statics.cleanOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $ne: 'critical' } // Keep critical logs
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 