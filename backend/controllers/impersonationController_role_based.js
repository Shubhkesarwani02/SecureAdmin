const { asyncHandler } = require('../middleware/errorHandler');
const { userService, auditService } = require('../services/database');
const crypto = require('crypto');

// @desc    Start impersonation session
// @route   POST /api/impersonation/start
// @access  Private (Superadmin/Admin with restrictions)
const startImpersonation = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const { targetUserId, reason } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate inputs
  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target user ID is required'
    });
  }

  try {
    // Check if target user exists and get their role
    const targetUserQuery = 'SELECT * FROM users WHERE id = $1 AND status = $2';
    const targetUserResult = await userService.executeQuery(targetUserQuery, [targetUserId, 'active']);
    
    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found or inactive'
      });
    }

    const targetUser = targetUserResult.rows[0];

    // Role-based permission checks
    if (currentUserRole === 'superadmin') {
      // Superadmin can impersonate admins and CSMs
      if (!['admin', 'csm'].includes(targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Superadmin can only impersonate admin and CSM users'
        });
      }
    } else if (currentUserRole === 'admin') {
      // Admin can only impersonate CSMs
      if (targetUser.role !== 'csm') {
        return res.status(403).json({
          success: false,
          message: 'Admin can only impersonate CSM users'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions for impersonation.'
      });
    }

    // Generate unique session ID
    const sessionId = `imp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create impersonation log entry (simplified without table dependency)
    const logData = {
      sessionId,
      impersonatorId: currentUserId,
      targetUserId,
      reason,
      startTime: new Date(),
      ipAddress,
      userAgent
    };

    // Log the action in audit trail
    await auditService.logAction({
      userId: currentUserId,
      action: 'impersonation.start',
      resource: 'user',
      resourceId: targetUserId,
      details: { 
        session_id: sessionId,
        target_user_email: targetUser.email,
        reason 
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          role: targetUser.role
        },
        expiresAt: new Date(Date.now() + 59 * 60 * 1000), // 59 minutes from now
        startedAt: new Date()
      },
      message: 'Impersonation session started successfully'
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
// @access  Private (Impersonator only)
const stopImpersonation = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { sessionId } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    // Log the action
    await auditService.logAction({
      userId: currentUserId,
      action: 'impersonation.stop',
      resource: 'user',
      details: { 
        session_id: sessionId
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Impersonation session ended successfully'
    });

  } catch (error) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping impersonation session'
    });
  }
});

// @desc    Get impersonation history
// @route   GET /api/impersonation/history
// @access  Private (Superadmin sees all, Admin sees own)
const getImpersonationHistory = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Mock data for now - replace with actual database queries
    const mockHistory = [
      {
        id: '1',
        sessionId: 'imp_1234567890_abc123',
        impersonator: {
          id: currentUserId,
          email: 'admin@framtt.com',
          full_name: 'Admin User'
        },
        targetUser: {
          id: '3',
          email: 'csm@framtt.com', 
          full_name: 'CSM User'
        },
        reason: 'Debugging client issue',
        status: 'ended',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        durationMinutes: 60,
        ipAddress: '192.168.1.100'
      }
    ];

    const filteredHistory = currentUserRole === 'superadmin' 
      ? mockHistory 
      : mockHistory.filter(h => h.impersonator.id === currentUserId);

    res.status(200).json({
      success: true,
      data: {
        logs: filteredHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalCount: filteredHistory.length,
          hasNextPage: false,
          hasPrevPage: false
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

module.exports = {
  startImpersonation,
  stopImpersonation,
  getImpersonationHistory
};
