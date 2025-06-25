const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const testCaseRoutes = require('./routes/testcase');
const testStepRoutes = require('./routes/teststep');
const testSuiteRoutes = require('./routes/testsuite');
const userRoutes = require('./routes/user');
const auditLogRoutes = require('./routes/auditlog');
const reportRoutes = require('./routes/reports');

// Initialize express app
const app = express();

const allowedOrigins = [
  'http://localhost:3000', // Local frontend
  'https://mw-game-qa-system.vercel.app' // Canlı frontend (gerekirse)
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/teststeps', testStepRoutes);
app.use('/api/testsuites', testSuiteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auditlogs', auditLogRoutes);
app.use('/api/reports', reportRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile Game QA Test Management System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      testSteps: {
        list: 'GET /api/teststeps',
        create: 'POST /api/teststeps',
        getById: 'GET /api/teststeps/:id',
        update: 'PUT /api/teststeps/:id',
        delete: 'DELETE /api/teststeps/:id',
        search: 'GET /api/teststeps/search',
        templates: 'GET /api/teststeps/templates'
      },
      testSuites: {
        list: 'GET /api/testsuites',
        create: 'POST /api/testsuites',
        getById: 'GET /api/testsuites/:id',
        update: 'PUT /api/testsuites/:id',
        delete: 'DELETE /api/testsuites/:id',
        search: 'GET /api/testsuites/search',
        byModule: 'GET /api/testsuites/module/:module',
        byVersion: 'GET /api/testsuites/version/:version'
      },
      testCases: {
        list: 'GET /api/testcases',
        create: 'POST /api/testcases',
        getById: 'GET /api/testcases/:id',
        update: 'PUT /api/testcases/:id',
        delete: 'DELETE /api/testcases/:id',
        search: 'GET /api/testcases/search',
        bySuite: 'GET /api/testcases/suite/:suiteId',
        byStatus: 'GET /api/testcases/status/:status',
        updateStepStatus: 'PATCH /api/testcases/:id/steps/:stepId',
        addStepLog: 'POST /api/testcases/:id/steps/:stepId/logs',
        startExecution: 'POST /api/testcases/:id/start',
        completeExecution: 'POST /api/testcases/:id/complete'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        getById: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        search: 'GET /api/users/search'
      },
      auditLogs: {
        list: 'GET /api/auditlogs',
        getById: 'GET /api/auditlogs/:id',
        byUser: 'GET /api/auditlogs/user/:userId',
        byResource: 'GET /api/auditlogs/resource/:resource/:resourceId',
        statistics: 'GET /api/auditlogs/statistics'
      },
      uploads: {
        uploadFile: 'POST /api/uploads/file',
        uploadMultiple: 'POST /api/uploads/multiple',
        deleteFile: 'DELETE /api/uploads/:publicId'
      }
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.options('*', cors(corsOptions));
module.exports = app;
