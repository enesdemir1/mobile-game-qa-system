const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }
    
    next();
  };
};

// Validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    role: Joi.string().valid('tester', 'developer', 'admin', 'lead').default('tester')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  update: Joi.object({
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    role: Joi.string().valid('tester', 'developer', 'admin', 'lead'),
    isActive: Joi.boolean(),
    permissions: Joi.array().items(Joi.string())
  })
};

const testStepSchemas = {
  create: Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(1000).required(),
    expectedResult: Joi.string().max(500).required(),
    stepNumber: Joi.number().min(1).required(),
    tags: Joi.array().items(Joi.string().max(50)),
    category: Joi.string().valid('functional', 'ui', 'performance', 'security', 'compatibility', 'regression', 'smoke', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    estimatedTime: Joi.number().min(1),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    notes: Joi.string().max(500),
    isTemplate: Joi.boolean(),
    templateName: Joi.string().max(100)
  }),

  update: Joi.object({
    title: Joi.string().max(200),
    description: Joi.string().max(1000),
    expectedResult: Joi.string().max(500),
    stepNumber: Joi.number().min(1),
    tags: Joi.array().items(Joi.string().max(50)),
    category: Joi.string().valid('functional', 'ui', 'performance', 'security', 'compatibility', 'regression', 'smoke', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    estimatedTime: Joi.number().min(1),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    notes: Joi.string().max(500),
    isTemplate: Joi.boolean(),
    templateName: Joi.string().max(100)
  })
};

const testSuiteSchemas = {
  create: Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(1000).required(),
    module: Joi.string().max(100).required(),
    version: Joi.string().max(20).required(),
    platform: Joi.string().valid('android', 'ios', 'both', 'web', 'desktop').required(),
    gameMode: Joi.string().max(100),
    category: Joi.string().valid('regression', 'smoke', 'functional', 'performance', 'security', 'compatibility', 'user_acceptance', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    estimatedDuration: Joi.number().min(1),
    tags: Joi.array().items(Joi.string().max(50)),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    isAutomated: Joi.boolean(),
    automationFramework: Joi.string().max(100),
    executionOrder: Joi.number(),
    assignedTo: Joi.string().hex().length(24)
  }),

  update: Joi.object({
    title: Joi.string().max(200),
    description: Joi.string().max(1000),
    module: Joi.string().max(100),
    version: Joi.string().max(20),
    platform: Joi.string().valid('android', 'ios', 'both', 'web', 'desktop'),
    gameMode: Joi.string().max(100),
    category: Joi.string().valid('regression', 'smoke', 'functional', 'performance', 'security', 'compatibility', 'user_acceptance', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    estimatedDuration: Joi.number().min(1),
    tags: Joi.array().items(Joi.string().max(50)),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    status: Joi.string().valid('draft', 'active', 'archived', 'deprecated'),
    isAutomated: Joi.boolean(),
    automationFramework: Joi.string().max(100),
    executionOrder: Joi.number(),
    assignedTo: Joi.string().hex().length(24)
  })
};

const testCaseSchemas = {
  create: Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(1000).required(),
    suiteId: Joi.string().hex().length(24),
    assignedTo: Joi.string().hex().length(24),
    buildVersion: Joi.string().max(20).required(),
    platform: Joi.string().valid('android', 'ios', 'both', 'web', 'desktop').required(),
    gameMode: Joi.string().max(100),
    deviceInfo: Joi.object({
      deviceModel: Joi.string().max(100),
      osVersion: Joi.string().max(20),
      screenResolution: Joi.string().max(20),
      networkType: Joi.string().valid('wifi', '4g', '3g', '2g', 'offline')
    }),
    tags: Joi.array().items(Joi.string().max(50)),
    category: Joi.string().valid('regression', 'smoke', 'functional', 'performance', 'security', 'compatibility', 'user_acceptance', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    estimatedTime: Joi.number().min(1),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    notes: Joi.string().max(1000),
    isAutomated: Joi.boolean(),
    automationScript: Joi.string().max(500),
    stepRefs: Joi.array().items(Joi.string().hex().length(24))
  }),

  update: Joi.object({
    title: Joi.string().max(200),
    description: Joi.string().max(1000),
    assignedTo: Joi.string().hex().length(24),
    buildVersion: Joi.string().max(20),
    platform: Joi.string().valid('android', 'ios', 'both', 'web', 'desktop'),
    gameMode: Joi.string().max(100),
    deviceInfo: Joi.object({
      deviceModel: Joi.string().max(100),
      osVersion: Joi.string().max(20),
      screenResolution: Joi.string().max(20),
      networkType: Joi.string().valid('wifi', '4g', '3g', '2g', 'offline')
    }),
    tags: Joi.array().items(Joi.string().max(50)),
    category: Joi.string().valid('regression', 'smoke', 'functional', 'performance', 'security', 'compatibility', 'user_acceptance', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    status: Joi.string().valid('draft', 'ready', 'in_progress', 'completed', 'blocked', 'failed', 'passed'),
    estimatedTime: Joi.number().min(1),
    prerequisites: Joi.array().items(Joi.string().max(200)),
    notes: Joi.string().max(1000),
    isAutomated: Joi.boolean(),
    automationScript: Joi.string().max(500)
  }),

  updateStepStatus: Joi.object({
    status: Joi.string().valid('not_started', 'in_progress', 'passed', 'failed', 'blocked', 'skipped').required(),
    notes: Joi.string().max(500)
  }),

  addStepLog: Joi.object({
    message: Joi.string().required(),
    level: Joi.string().valid('info', 'warning', 'error', 'debug'),
    attachments: Joi.array().items(Joi.object({
      type: Joi.string().valid('image', 'video', 'document', 'other').required(),
      url: Joi.string().required(),
      filename: Joi.string().required(),
      size: Joi.number().required(),
      mimeType: Joi.string().required()
    }))
  })
};

const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    search: Joi.string().min(1),
    category: Joi.string(),
    status: Joi.string(),
    priority: Joi.string(),
    platform: Joi.string(),
    assignedTo: Joi.string().hex().length(24),
    createdBy: Joi.string().hex().length(24),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate'))
  })
};

module.exports = {
  validate,
  userSchemas,
  testStepSchemas,
  testSuiteSchemas,
  testCaseSchemas,
  querySchemas
}; 