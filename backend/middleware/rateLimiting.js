const rateLimit = require('express-rate-limit');
const { auditService } = require('../services/database');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req, res) => {
    // Log rate limit violations
    await auditService.log({
      userId: req.user?.id || null,
      action: 'RATE_LIMIT_EXCEEDED',
      resourceType: 'SECURITY',
      resourceId: req.path,
      oldValues: null,
      newValues: { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: async (req, res) => {
    // Log failed login attempts
    await auditService.log({
      userId: null,
      action: 'LOGIN_RATE_LIMIT_EXCEEDED',
      resourceType: 'SECURITY',
      resourceId: req.body?.email || 'unknown',
      oldValues: null,
      newValues: { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        attemptedEmail: req.body?.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Very strict rate limiting for impersonation endpoints
const impersonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 impersonation attempts per hour
  message: {
    success: false,
    message: 'Too many impersonation attempts. Please try again later.',
    error: 'IMPERSONATION_RATE_LIMIT_EXCEEDED'
  },
  handler: async (req, res) => {
    // Log impersonation rate limit violations
    await auditService.log({
      userId: req.user?.id || null,
      action: 'IMPERSONATION_RATE_LIMIT_EXCEEDED',
      resourceType: 'SECURITY',
      resourceId: req.body?.targetUserId || 'unknown',
      oldValues: null,
      newValues: { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        targetUserId: req.body?.targetUserId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many impersonation attempts. Please try again later.',
      error: 'IMPERSONATION_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Rate limiting for password change endpoints
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password change attempts per hour
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again later.',
    error: 'PASSWORD_CHANGE_RATE_LIMIT_EXCEEDED'
  },
  handler: async (req, res) => {
    // Log password change rate limit violations
    await auditService.log({
      userId: req.user?.id || null,
      action: 'PASSWORD_CHANGE_RATE_LIMIT_EXCEEDED',
      resourceType: 'SECURITY',
      resourceId: req.user?.id || 'unknown',
      oldValues: null,
      newValues: { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many password change attempts. Please try again later.',
      error: 'PASSWORD_CHANGE_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Rate limiting for admin operations
const adminOperationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 admin operations per 5 minutes
  message: {
    success: false,
    message: 'Too many admin operations. Please slow down.',
    error: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  handler: async (req, res) => {
    // Log admin operations rate limit violations
    await auditService.log({
      userId: req.user?.id || null,
      action: 'ADMIN_RATE_LIMIT_EXCEEDED',
      resourceType: 'SECURITY',
      resourceId: req.path,
      oldValues: null,
      newValues: { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many admin operations. Please slow down.',
      error: 'ADMIN_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  impersonationLimiter,
  passwordChangeLimiter,
  adminOperationsLimiter
};
