const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!User.hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  };
};

// Middleware to log user actions
const logUserAction = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setTimeout(async () => {
        try {
          const resourceId = req.params.id || req.body.id;
          const resourceName = req.body.title || req.body.name || resource;
          
          await AuditLog.logUserAction(
            req.user._id,
            action,
            resource,
            resourceId,
            {
              before: req.originalBody,
              after: req.body,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              sessionId: req.session?.id
            }
          );
        } catch (error) {
          logger.error('Error logging user action:', error);
        }
      }, 0);
      
      originalSend.call(this, data);
    };
    
    // Store original body for comparison
    req.originalBody = JSON.parse(JSON.stringify(req.body));
    next();
  };
};

// Middleware to check if user can access resource
const canAccessResource = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return next();
      }

      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user is the creator or assigned to the resource
      if (resource.createdBy && resource.createdBy.toString() === req.user._id.toString()) {
        return next();
      }

      if (resource.assignedTo && resource.assignedTo.toString() === req.user._id.toString()) {
        return next();
      }

      // For test cases, check if user can access the suite
      if (resource.suiteId) {
        const TestSuite = require('../models/TestSuite');
        const suite = await TestSuite.findById(resource.suiteId);
        
        if (suite && (suite.assignedTo?.toString() === req.user._id.toString() || 
                     suite.createdBy?.toString() === req.user._id.toString())) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this resource'
      });
    } catch (error) {
      logger.error('Error checking resource access:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource access'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  logUserAction,
  canAccessResource
}; 