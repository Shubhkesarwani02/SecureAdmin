const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  userService, 
  tokenService, 
  auditService,
  impersonationService 
} = require('../services/database');

// Generate access token
const generateAccessToken = (user, impersonationData = null) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name
  };

  // Add impersonation data if present
  if (impersonationData) {
    payload.impersonator_id = impersonationData.impersonator_id;
    payload.impersonated_user_id = impersonationData.impersonated_user_id;
    payload.session_id = impersonationData.session_id;
    payload.is_impersonation = true;
  }

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user by email
  const user = await userService.findByEmail(email.toLowerCase());
  
  if (!user) {
    // Log failed login attempt
    await auditService.log({
      userId: null,
      action: 'LOGIN_FAILED',
      resourceType: 'AUTH',
      resourceId: null,
      oldValues: null,
      newValues: { email, reason: 'User not found' },
      ipAddress,
      userAgent
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    await auditService.log({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resourceType: 'AUTH',
      resourceId: user.id,
      oldValues: null,
      newValues: { email, reason: 'Account not active', status: user.status },
      ipAddress,
      userAgent
    });

    return res.status(401).json({
      success: false,
      message: 'Account is not active'
    });
  }

  // Verify password
  const isMatch = await userService.verifyPassword(password, user.password_hash);

  if (!isMatch) {
    await auditService.log({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resourceType: 'AUTH',
      resourceId: user.id,
      oldValues: null,
      newValues: { email, reason: 'Invalid password' },
      ipAddress,
      userAgent
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await userService.updateLastLogin(user.id);

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await tokenService.store(user.id, refreshTokenHash, expiresAt);

  // Log successful login
  await auditService.log({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resourceType: 'AUTH',
    resourceId: user.id,
    oldValues: null,
    newValues: { email },
    ipAddress,
    userAgent
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token: accessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        avatar: user.avatar,
        preferences: user.preferences,
        isImpersonationActive: user.is_impersonation_active,
        currentImpersonatorId: user.current_impersonator_id
      }
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not provided'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = await tokenService.findValid(tokenHash);

  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }

  // Generate new access token
  const user = await userService.findById(tokenData.user_id);
  const accessToken = generateAccessToken(user);

  res.status(200).json({
    success: true,
    data: {
      token: accessToken
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, bio, department } = req.body;
  
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update user profile
  if (fullName) users[userIndex].fullName = fullName;
  if (phone) users[userIndex].phone = phone;
  if (bio) users[userIndex].bio = bio;
  if (department) users[userIndex].department = department;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: users[userIndex].id,
      fullName: users[userIndex].fullName,
      email: users[userIndex].email,
      phone: users[userIndex].phone,
      bio: users[userIndex].bio,
      department: users[userIndex].department,
      role: users[userIndex].role
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update preferences
  users[userIndex].preferences = {
    ...users[userIndex].preferences,
    ...req.body
  };

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: users[userIndex].preferences
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.cookies;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await tokenService.revoke(tokenHash);
  }

  // Log logout
  await auditService.log({
    userId: req.user.id,
    action: 'LOGOUT',
    resourceType: 'AUTH',
    resourceId: req.user.id,
    oldValues: null,
    newValues: null,
    ipAddress,
    userAgent
  });

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Start impersonation
// @route   POST /api/auth/impersonate/start
// @access  Private (Admin/Superadmin only)
const startImpersonation = asyncHandler(async (req, res) => {
  const { targetUserId, reason } = req.body;
  const impersonatorId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target user ID is required'
    });
  }

  // Get impersonator and target user
  const impersonator = await userService.findById(impersonatorId);
  const targetUser = await userService.findById(targetUserId);

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'Target user not found'
    });
  }

  // Check permissions for impersonation with detailed role hierarchy
  let canImpersonate = false;
  let denialReason = '';

  if (impersonator.role === 'superadmin') {
    // Superadmin can impersonate anyone (including other superadmins)
    canImpersonate = true;
  } else if (impersonator.role === 'admin') {
    // Admin can impersonate CSMs and regular users, but NOT other admins or superadmins
    if (targetUser.role === 'csm' || targetUser.role === 'user') {
      canImpersonate = true;
    } else {
      denialReason = `Admin cannot impersonate ${targetUser.role} users`;
    }
  } else if (impersonator.role === 'csm') {
    // CSMs cannot impersonate anyone
    denialReason = 'CSMs do not have impersonation privileges';
  } else {
    // Regular users cannot impersonate anyone
    denialReason = 'Regular users do not have impersonation privileges';
  }

  // Additional check: Cannot impersonate yourself
  if (impersonatorId === targetUserId) {
    canImpersonate = false;
    denialReason = 'Cannot impersonate yourself';
  }

  // Additional check: Prevent impersonating already impersonated users
  if (targetUser.is_impersonation_active) {
    canImpersonate = false;
    denialReason = 'Target user is already being impersonated';
  }

  if (!canImpersonate) {
    await auditService.log({
      userId: impersonatorId,
      action: 'IMPERSONATION_DENIED',
      resourceType: 'IMPERSONATION',
      resourceId: targetUserId,
      oldValues: null,
      newValues: { 
        targetUserId, 
        targetRole: targetUser.role,
        impersonatorRole: impersonator.role,
        reason: denialReason 
      },
      ipAddress,
      userAgent
    });

    return res.status(403).json({
      success: false,
      message: `You do not have permission to impersonate this user. ${denialReason}`,
      details: {
        yourRole: impersonator.role,
        targetRole: targetUser.role,
        reason: denialReason
      }
    });
  }

  // Generate session ID for impersonation
  const sessionId = crypto.randomUUID();

  // Start impersonation session
  const impersonationLog = await impersonationService.start({
    impersonatorId,
    impersonatedId: targetUserId,
    reason,
    ipAddress,
    userAgent,
    sessionId
  });

  // Generate impersonation token
  const impersonationToken = generateAccessToken(targetUser, {
    impersonator_id: impersonatorId,
    impersonated_user_id: targetUserId,
    session_id: sessionId
  });

  // Log impersonation start
  await auditService.log({
    userId: targetUserId,
    impersonatorId: impersonatorId,
    action: 'IMPERSONATION_STARTED',
    resourceType: 'IMPERSONATION',
    resourceId: targetUserId,
    oldValues: null,
    newValues: { targetUserId, reason, sessionId },
    ipAddress,
    userAgent
  });

  res.status(200).json({
    success: true,
    message: 'Impersonation started successfully',
    data: {
      impersonationToken,
      sessionId,
      targetUser: {
        id: targetUser.id,
        fullName: targetUser.full_name,
        email: targetUser.email,
        role: targetUser.role
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }
  });
});

// @desc    Stop impersonation
// @route   POST /api/auth/impersonate/stop
// @access  Private (Impersonation token required)
const stopImpersonation = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const impersonatorId = req.user.impersonator_id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (!req.user.is_impersonation) {
    return res.status(400).json({
      success: false,
      message: 'No active impersonation session'
    });
  }

  // End impersonation session
  const impersonationLog = await impersonationService.end(impersonatorId, sessionId);

  if (!impersonationLog) {
    return res.status(404).json({
      success: false,
      message: 'Impersonation session not found'
    });
  }

  // Log impersonation end
  await auditService.log({
    userId: req.user.id,
    impersonatorId: impersonatorId,
    action: 'IMPERSONATION_ENDED',
    resourceType: 'IMPERSONATION',
    resourceId: req.user.id,
    oldValues: null,
    newValues: { sessionId },
    ipAddress,
    userAgent
  });

  res.status(200).json({
    success: true,
    message: 'Impersonation ended successfully'
  });
});

// @desc    Get active impersonation sessions
// @route   GET /api/auth/impersonate/active
// @access  Private (Admin/Superadmin only)
const getActiveImpersonations = asyncHandler(async (req, res) => {
  const activeSessions = await impersonationService.getActive(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      sessions: activeSessions,
      count: activeSessions.length
    }
  });
});

// @desc    Get impersonation history
// @route   GET /api/auth/impersonate/history
// @access  Private (Admin/Superadmin only)
const getImpersonationHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    targetUserId
  } = req.query;

  const options = {
    impersonatorId: req.user.id,
    impersonatedId: targetUserId,
    page: parseInt(page),
    limit: parseInt(limit),
    startDate,
    endDate
  };

  const history = await impersonationService.getHistory(options);

  res.status(200).json({
    success: true,
    data: history
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  // Get user
  const user = await userService.findById(userId);
  
  // Verify current password
  const isMatch = await userService.verifyPassword(currentPassword, user.password_hash);
  
  if (!isMatch) {
    await auditService.log({
      userId,
      action: 'PASSWORD_CHANGE_FAILED',
      resourceType: 'AUTH',
      resourceId: userId,
      oldValues: null,
      newValues: { reason: 'Invalid current password' },
      ipAddress,
      userAgent
    });

    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await userService.update(userId, { password: newPassword });

  // Revoke all refresh tokens for this user
  await tokenService.revokeAllForUser(userId);

  // Log password change
  await auditService.log({
    userId,
    action: 'PASSWORD_CHANGED',
    resourceType: 'AUTH',
    resourceId: userId,
    oldValues: null,
    newValues: null,
    ipAddress,
    userAgent
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
});

module.exports = {
  login,
  refreshToken,
  getMe,
  logout,
  startImpersonation,
  stopImpersonation,
  getActiveImpersonations,
  getImpersonationHistory,
  changePassword
};