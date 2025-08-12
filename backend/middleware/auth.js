const jwt = require('jsonwebtoken');
const { userService, auditService } = require('../services/database');

// Verify JWT token (supports both regular and impersonation tokens)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Check if user exists and is active
    const user = await userService.findById(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or inactive.'
      });
    }

    // Set user context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
      is_impersonation: decoded.is_impersonation || false,
      impersonator_id: decoded.impersonator_id || null,
      impersonated_user_id: decoded.impersonated_user_id || null,
      session_id: decoded.session_id || null
    };

    // Log API access for audit purposes
    await auditService.log({
      userId: req.user.id,
      impersonatorId: req.user.impersonator_id,
      action: 'API_ACCESS',
      resourceType: 'API',
      resourceId: `${req.method} ${req.path}`,
      oldValues: null,
      newValues: { 
        method: req.method, 
        path: req.path, 
        query: req.query,
        isImpersonation: req.user.is_impersonation 
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Role hierarchy definition
const ROLE_HIERARCHY = {
  'superadmin': 4,
  'admin': 3,
  'csm': 2,
  'user': 1
};

// Check if user has minimum required role level
const hasMinimumRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // For impersonation, check the impersonator's role, not the impersonated user's role
    let effectiveRole = req.user.role;
    
    if (req.user.is_impersonation && req.user.impersonator_id) {
      // Get the impersonator's role from database
      const { userService } = require('../services/database');
      const impersonator = await userService.findById(req.user.impersonator_id);
      effectiveRole = impersonator ? impersonator.role : req.user.role;
      
      // Store impersonator role for later use
      req.user.impersonator_role = effectiveRole;
    }

    if (!allowedRoles.includes(effectiveRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${effectiveRole}`
      });
    }

    next();
  };
};

// Verify superadmin role
const verifySuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // For impersonation, check the impersonator's role
  const effectiveRole = req.user.is_impersonation && req.user.impersonator_id 
    ? req.user.impersonator_role 
    : req.user.role;

  if (effectiveRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Superadmin privileges required.'
    });
  }

  next();
};

// Verify admin or superadmin role
const verifyAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const effectiveRole = req.user.is_impersonation && req.user.impersonator_id 
    ? req.user.impersonator_role 
    : req.user.role;

  if (!['admin', 'superadmin'].includes(effectiveRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Superadmin privileges required.'
    });
  }

  next();
};

// Check if user can manage target user (based on role hierarchy)
const canManageUser = async (req, res, next) => {
  const { userId: targetUserId } = req.params;
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  if (currentUserId === targetUserId) {
    // Users can always manage themselves
    return next();
  }

  // Get the effective role (considering impersonation)
  let effectiveRole = currentUserRole;
  if (req.user.is_impersonation && req.user.impersonator_id) {
    const { userService } = require('../services/database');
    const impersonator = await userService.findById(req.user.impersonator_id);
    effectiveRole = impersonator ? impersonator.role : currentUserRole;
  }

  // Get target user's role
  const { userService } = require('../services/database');
  const targetUser = await userService.findById(targetUserId);
  
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'Target user not found.'
    });
  }

  const targetUserRole = targetUser.role;

  // Role hierarchy checks
  if (effectiveRole === 'superadmin') {
    // Superadmin can manage anyone
    return next();
  }

  if (effectiveRole === 'admin') {
    // Admin can manage CSMs and regular users, but not other admins or superadmins
    if (['csm', 'user'].includes(targetUserRole)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins cannot manage other admins or superadmins.'
    });
  }

  if (effectiveRole === 'csm') {
    // CSMs can only manage regular users in their assigned accounts
    if (targetUserRole === 'user') {
      // Additional check needed: verify the user is in CSM's assigned accounts
      const { csmAssignmentService, userAccountService } = require('../services/database');
      const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
      const userAccounts = await userAccountService.getByUser(targetUserId);
      
      const hasCommonAccount = csmAssignments.some(assignment => 
        userAccounts.some(userAccount => userAccount.account_id === assignment.account_id)
      );
      
      if (hasCommonAccount) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. CSM can only manage users in assigned accounts.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. CSMs can only manage regular users.'
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient privileges to manage this user.'
  });
};

// Check account access based on role and assignments
const checkAccountAccess = async (req, res, next) => {
  const { accountId } = req.params;
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  try {
    // Get the effective role (considering impersonation)
    let effectiveRole = currentUserRole;
    if (req.user.is_impersonation && req.user.impersonator_id) {
      const { userService } = require('../services/database');
      const impersonator = await userService.findById(req.user.impersonator_id);
      effectiveRole = impersonator ? impersonator.role : currentUserRole;
    }

    if (effectiveRole === 'superadmin' || effectiveRole === 'admin') {
      // Superadmin and Admin have access to all accounts
      return next();
    }

    if (effectiveRole === 'csm') {
      // CSM can only access assigned accounts
      const { csmAssignmentService } = require('../services/database');
      const assignments = await csmAssignmentService.getByCSM(currentUserId);
      const hasAccess = assignments.some(assignment => assignment.account_id === accountId);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Account not assigned to this CSM.'
        });
      }
      return next();
    }

    if (effectiveRole === 'user') {
      // Regular users can only access accounts they are assigned to
      const { userAccountService } = require('../services/database');
      const userAccounts = await userAccountService.getByUser(currentUserId);
      const hasAccess = userAccounts.some(userAccount => userAccount.account_id === accountId);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have access to this account.'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient privileges.'
    });
  } catch (error) {
    console.error('Error checking account access:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking account access.'
    });
  }
};

// Combined middleware for different access levels
const requireSuperAdmin = [verifyToken, verifySuperAdmin];
const requireAdmin = [verifyToken, verifyAdminOrSuperAdmin];
const requireCSMOrAbove = [verifyToken, requireRole(['csm', 'admin', 'superadmin'])];
const requireAuthenticated = [verifyToken];

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await userService.findById(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          fullName: decoded.fullName,
          is_impersonation: decoded.is_impersonation || false,
          impersonator_id: decoded.impersonator_id || null,
          impersonated_user_id: decoded.impersonated_user_id || null,
          session_id: decoded.session_id || null
        };
      }
    } catch (error) {
      // Invalid token, but we continue without user context
      req.user = null;
    }
  }

  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would typically use a more sophisticated rate limiting solution
  // For now, we'll implement basic checks
  const sensitiveOps = ['impersonate', 'change-password', 'create-user', 'delete-user'];
  const operation = req.path.toLowerCase();
  
  const isSensitive = sensitiveOps.some(op => operation.includes(op));
  
  if (isSensitive) {
    // Add additional rate limiting logic here
    // For now, just log the sensitive operation
    console.log(`Sensitive operation attempted: ${operation} by user ${req.user?.id}`);
  }
  
  next();
};

// Check if user can view all data (Superadmin only)
const canViewAllData = async (req, res, next) => {
  const effectiveRole = await getEffectiveRole(req.user);
  
  if (effectiveRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Superadmin privileges required to view all data.'
    });
  }
  
  next();
};

// Check if user can manage all customer accounts (Admin/Superadmin)
const canManageAllCustomers = async (req, res, next) => {
  const effectiveRole = await getEffectiveRole(req.user);
  
  if (!['admin', 'superadmin'].includes(effectiveRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Superadmin privileges required.'
    });
  }
  
  next();
};

// Check if user can impersonate others
const canImpersonate = async (req, res, next) => {
  const { targetUserId } = req.body;
  const effectiveRole = await getEffectiveRole(req.user);
  
  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target user ID is required for impersonation.'
    });
  }

  // Get target user to check their role
  const { userService } = require('../services/database');
  const targetUser = await userService.findById(targetUserId);
  
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'Target user not found.'
    });
  }

  let canImpersonate = false;

  if (effectiveRole === 'superadmin') {
    // Superadmin can impersonate anyone
    canImpersonate = true;
  } else if (effectiveRole === 'admin') {
    // Admin can impersonate CSMs and regular users, but not other admins or superadmins
    if (['csm', 'user'].includes(targetUser.role)) {
      canImpersonate = true;
    }
  }

  if (!canImpersonate) {
    return res.status(403).json({
      success: false,
      message: `Access denied. You cannot impersonate a ${targetUser.role}.`
    });
  }

  next();
};

// Helper function to get effective role (considering impersonation)
const getEffectiveRole = async (user) => {
  if (user.is_impersonation && user.impersonator_id) {
    const { userService } = require('../services/database');
    const impersonator = await userService.findById(user.impersonator_id);
    return impersonator ? impersonator.role : user.role;
  }
  return user.role;
};

module.exports = {
  verifyToken,
  requireRole,
  verifySuperAdmin,
  verifyAdminOrSuperAdmin,
  canManageUser,
  checkAccountAccess,
  requireSuperAdmin,
  requireAdmin,
  requireCSMOrAbove,
  requireAuthenticated,
  optionalAuth,
  sensitiveOperationLimit,
  canViewAllData,
  canManageAllCustomers,
  canImpersonate,
  getEffectiveRole,
  hasMinimumRole,
  ROLE_HIERARCHY
};