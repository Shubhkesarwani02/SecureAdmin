const { asyncHandler } = require('../middleware/errorHandler');
const { userService, auditService } = require('../services/database');
const jwt = require('jsonwebtoken');

// In-memory session storage (in production, use Redis or database)
const activeSessions = new Map();

// @desc    Start impersonation session
// @route   POST /api/impersonation/start
// @access  Private (Superadmin, Admin with restrictions)
const startImpersonation = asyncHandler(async (req, res) => {
  const { targetUserId, reason } = req.body;
  const impersonatorId = req.user.id;
  const impersonatorRole = req.user.role;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target user ID is required'
    });
  }

  try {
    // Get target user data
    const targetUserQuery = 'SELECT * FROM users WHERE id = $1 AND status = $2';
    const targetUserResult = await userService.executeQuery(targetUserQuery, [targetUserId, 'active']);
    const targetUser = targetUserResult.rows[0];

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found or inactive'
      });
    }

    // Role-based impersonation restrictions
    if (impersonatorRole === 'admin') {
      // Admin can only impersonate CSMs and regular users
      if (!['csm', 'user'].includes(targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only impersonate CSM and regular users'
        });
      }
    } else if (impersonatorRole === 'csm') {
      // CSM cannot impersonate anyone
      return res.status(403).json({
        success: false,
        message: 'CSM cannot impersonate other users'
      });
    } else if (impersonatorRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to impersonate users'
      });
    }

    // Check if target user is already being impersonated
    const existingSession = Array.from(activeSessions.values()).find(
      session => session.targetUserId === targetUserId && session.status === 'active'
    );

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'User is already being impersonated by another admin'
      });
    }

    // Check if impersonator already has an active session
    const impersonatorSession = Array.from(activeSessions.values()).find(
      session => session.impersonatorId === impersonatorId && session.status === 'active'
    );

    if (impersonatorSession) {
      // Auto-stop the previous session
      await stopImpersonationSession(impersonatorSession.sessionId, 'auto_ended_new_session');
    }

    // Create new session
    const sessionId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + (59 * 60 * 1000)); // 59 minutes
    
    const sessionData = {
      sessionId,
      impersonatorId,
      targetUserId,
      impersonatorRole,
      targetUserRole: targetUser.role,
      reason: reason || 'No reason provided',
      startTime: new Date(),
      expiresAt,
      status: 'active',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      actionsPerformed: []
    };

    activeSessions.set(sessionId, sessionData);

    // Log to database
    const logQuery = `
      INSERT INTO impersonation_logs (
        session_id, impersonator_id, target_user_id, reason, 
        start_time, expires_at, status, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await userService.executeQuery(logQuery, [
      sessionId, impersonatorId, targetUserId, sessionData.reason,
      sessionData.startTime, expiresAt, 'active', req.ip, req.get('User-Agent')
    ]);

    // Log audit trail
    await auditService.logAction(
      impersonatorId,
      'impersonation',
      'start',
      targetUserId,
      { 
        targetUser: {
          id: targetUser.id,
          name: targetUser.full_name,
          email: targetUser.email,
          role: targetUser.role
        },
        reason: sessionData.reason,
        sessionId
      },
      req.ip,
      req.get('User-Agent')
    );

    // Create impersonation token
    const impersonationToken = jwt.sign(
      {
        impersonatorId,
        targetUserId,
        sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000)
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation started successfully',
      data: {
        sessionId,
        targetUser: {
          id: targetUser.id,
          full_name: targetUser.full_name,
          email: targetUser.email,
          role: targetUser.role
        },
        expiresAt,
        impersonationToken
      }
    });

  } catch (error) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting impersonation session'
    });
  }
});

// @desc    Stop impersonation session
// @route   POST /api/impersonation/stop
// @access  Private
const stopImpersonation = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  try {
    const result = await stopImpersonationSession(sessionId, 'manual_stop', userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping impersonation session'
    });
  }
});

// Helper function to stop impersonation session
const stopImpersonationSession = async (sessionId, endReason = 'manual_stop', userId = null) => {
  try {
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return {
        success: false,
        message: 'Session not found or already ended'
      };
    }

    // Update session data
    session.status = 'ended';
    session.endTime = new Date();
    session.endReason = endReason;
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);

    // Update database
    const updateQuery = `
      UPDATE impersonation_logs 
      SET end_time = $1, status = $2, end_reason = $3, duration_seconds = $4
      WHERE session_id = $5
    `;
    
    await userService.executeQuery(updateQuery, [
      session.endTime, 'ended', endReason, session.duration, sessionId
    ]);

    // Log audit trail
    await auditService.logAction(
      userId || session.impersonatorId,
      'impersonation',
      'stop',
      session.targetUserId,
      { 
        sessionId,
        duration: session.duration,
        endReason,
        actionsPerformed: session.actionsPerformed
      },
      session.ipAddress,
      session.userAgent
    );

    // Remove from active sessions
    activeSessions.delete(sessionId);

    return {
      success: true,
      message: 'Impersonation session ended successfully',
      data: {
        sessionId,
        duration: session.duration,
        endReason
      }
    };

  } catch (error) {
    console.error('Error stopping impersonation session:', error);
    throw error;
  }
};

// @desc    Get active impersonation sessions
// @route   GET /api/impersonation/active
// @access  Private (Superadmin, Admin for own sessions)
const getActiveSessions = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let sessions = Array.from(activeSessions.values());

    // Role-based filtering
    if (currentUserRole === 'admin') {
      // Admin can only see their own impersonation sessions
      sessions = sessions.filter(session => session.impersonatorId === currentUserId);
    } else if (currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    // Get user details for sessions
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const impersonatorQuery = 'SELECT id, full_name, email, role FROM users WHERE id = $1';
        const targetQuery = 'SELECT id, full_name, email, role FROM users WHERE id = $1';
        
        const impersonatorResult = await userService.executeQuery(impersonatorQuery, [session.impersonatorId]);
        const targetResult = await userService.executeQuery(targetQuery, [session.targetUserId]);
        
        return {
          ...session,
          impersonator: impersonatorResult.rows[0],
          targetUser: targetResult.rows[0]
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sessionsWithDetails
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active sessions'
    });
  }
});

// @desc    Get impersonation history
// @route   GET /api/impersonation/history
// @access  Private (Role-based)
const getImpersonationHistory = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10,
    status,
    targetUserId,
    startDate,
    endDate
  } = req.query;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let baseQuery = `
      SELECT 
        il.session_id,
        il.impersonator_id,
        il.target_user_id,
        il.reason,
        il.start_time,
        il.end_time,
        il.duration_seconds,
        il.status,
        il.end_reason,
        il.ip_address,
        il.user_agent,
        imp.full_name as impersonator_name,
        imp.email as impersonator_email,
        imp.role as impersonator_role,
        target.full_name as target_name,
        target.email as target_email,
        target.role as target_role
      FROM impersonation_logs il
      LEFT JOIN users imp ON il.impersonator_id = imp.id
      LEFT JOIN users target ON il.target_user_id = target.id
    `;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Role-based access control
    if (currentUserRole === 'admin') {
      // Admin can only see their own impersonation history
      whereConditions.push(`il.impersonator_id = $${paramIndex}`);
      queryParams.push(currentUserId);
      paramIndex++;
    } else if (currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions to view impersonation history'
      });
    }

    // Apply filters
    if (status) {
      whereConditions.push(`il.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (targetUserId) {
      whereConditions.push(`il.target_user_id = $${paramIndex}`);
      queryParams.push(targetUserId);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`il.start_time >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`il.start_time <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    // Add WHERE clause
    if (whereConditions.length > 0) {
      baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM impersonation_logs il
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
    `;
    
    const countResult = await userService.executeQuery(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0]?.total || 0);

    // Apply pagination and sorting
    baseQuery += ` ORDER BY il.start_time DESC`;
    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await userService.executeQuery(baseQuery, queryParams);
    const history = result.rows || [];

    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching impersonation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching impersonation history'
    });
  }
});

// @desc    Record action during impersonation
// @route   POST /api/impersonation/log-action
// @access  Private (During impersonation)
const logImpersonationAction = asyncHandler(async (req, res) => {
  const { sessionId, action, details } = req.body;

  if (!sessionId || !action) {
    return res.status(400).json({
      success: false,
      message: 'Session ID and action are required'
    });
  }

  try {
    const session = activeSessions.get(sessionId);
    
    if (!session || session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive session'
      });
    }

    // Add action to session
    session.actionsPerformed.push({
      action,
      details: details || {},
      timestamp: new Date()
    });

    // Update in database (you might want to create an impersonation_actions table)
    await auditService.logAction(
      session.impersonatorId,
      'impersonation_action',
      action,
      session.targetUserId,
      { 
        sessionId,
        action,
        details,
        asImpersonated: true
      },
      session.ipAddress,
      session.userAgent
    );

    res.status(200).json({
      success: true,
      message: 'Action logged successfully'
    });

  } catch (error) {
    console.error('Error logging impersonation action:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging action'
    });
  }
});

// Auto-cleanup expired sessions (run periodically)
const cleanupExpiredSessions = async () => {
  try {
    const now = new Date();
    const expiredSessions = Array.from(activeSessions.entries()).filter(
      ([sessionId, session]) => session.expiresAt < now && session.status === 'active'
    );

    for (const [sessionId, session] of expiredSessions) {
      await stopImpersonationSession(sessionId, 'expired');
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired impersonation sessions`);
    }

  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = {
  startImpersonation,
  stopImpersonation,
  getActiveSessions,
  getImpersonationHistory,
  logImpersonationAction,
  cleanupExpiredSessions
};
