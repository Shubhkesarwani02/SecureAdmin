const { asyncHandler } = require('../middleware/errorHandler');
const { auditService } = require('../services/database');

// Mock impersonation data - replace with real database integration
const mockImpersonationData = {
  sessions: [
    {
      id: 1,
      impersonatorId: 1,
      impersonatorName: 'Super Admin',
      impersonatorEmail: 'superadmin@framtt.com',
      impersonatedId: 26,
      impersonatedName: 'Sarah Wilson',
      impersonatedEmail: 'csm1@framtt.com',
      impersonatedRole: 'csm',
      startTime: new Date('2024-01-15T10:30:00Z'),
      endTime: new Date('2024-01-15T11:15:00Z'),
      duration: 45 * 60, // 45 minutes in seconds
      reason: 'Customer support assistance',
      status: 'completed',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actionsPerformed: [
        'Viewed client accounts',
        'Updated client contact info',
        'Sent notification to client'
      ]
    },
    {
      id: 2,
      impersonatorId: 1,
      impersonatorName: 'Super Admin',
      impersonatorEmail: 'superadmin@framtt.com',
      impersonatedId: 28,
      impersonatedName: 'John Smith',
      impersonatedEmail: 'user1@framtt.com',
      impersonatedRole: 'user',
      startTime: new Date('2024-01-14T14:20:00Z'),
      endTime: new Date('2024-01-14T14:35:00Z'),
      duration: 15 * 60, // 15 minutes in seconds
      reason: 'Troubleshooting login issues',
      status: 'completed',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actionsPerformed: [
        'Attempted login',
        'Reset password',
        'Verified account settings'
      ]
    },
    {
      id: 3,
      impersonatorId: 25,
      impersonatorName: 'Admin User',
      impersonatorEmail: 'admin@framtt.com',
      impersonatedId: 26,
      impersonatedName: 'Sarah Wilson',
      impersonatedEmail: 'csm1@framtt.com',
      impersonatedRole: 'csm',
      startTime: new Date('2024-01-13T16:00:00Z'),
      endTime: new Date('2024-01-13T16:30:00Z'),
      duration: 30 * 60, // 30 minutes in seconds
      reason: 'Training session',
      status: 'completed',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actionsPerformed: [
        'Reviewed dashboard features',
        'Practiced client management',
        'Updated profile settings'
      ]
    },
    {
      id: 4,
      impersonatorId: 1,
      impersonatorName: 'Super Admin',
      impersonatorEmail: 'superadmin@framtt.com',
      impersonatedId: 27,
      impersonatedName: 'Mike Johnson',
      impersonatedEmail: 'user2@framtt.com',
      impersonatedRole: 'user',
      startTime: new Date('2024-01-12T09:45:00Z'),
      endTime: null,
      duration: null,
      reason: 'System testing',
      status: 'terminated',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actionsPerformed: [
        'Started system test',
        'Session terminated by admin'
      ],
      terminatedAt: new Date('2024-01-12T09:50:00Z'),
      terminatedBy: 1,
      terminationReason: 'Emergency security protocol'
    },
    {
      id: 5,
      impersonatorId: 1,
      impersonatorName: 'Super Admin',
      impersonatorEmail: 'superadmin@framtt.com',
      impersonatedId: 26,
      impersonatedName: 'Sarah Wilson',
      impersonatedEmail: 'csm1@framtt.com',
      impersonatedRole: 'csm',
      startTime: new Date(),
      endTime: null,
      duration: null,
      reason: 'Live support session',
      status: 'active',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      actionsPerformed: [
        'Logged in as CSM',
        'Reviewing client tickets'
      ]
    }
  ]
};

// @desc    Get impersonation history
// @route   GET /api/impersonation/history
// @access  Private (Admin/Superadmin)
const getImpersonationHistory = asyncHandler(async (req, res) => {
  const {
    impersonatorId,
    impersonatedId,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = req.query;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  let filteredSessions = [...mockImpersonationData.sessions];

  // CSMs and lower roles can't view impersonation history
  if (currentUserRole === 'csm' || currentUserRole === 'user') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient privileges to view impersonation history'
    });
  }

  // Admins can only see their own impersonation sessions
  if (currentUserRole === 'admin') {
    filteredSessions = filteredSessions.filter(session => 
      session.impersonatorId === currentUserId
    );
  }

  // Apply filters
  if (impersonatorId) {
    filteredSessions = filteredSessions.filter(session => 
      session.impersonatorId === parseInt(impersonatorId)
    );
  }

  if (impersonatedId) {
    filteredSessions = filteredSessions.filter(session => 
      session.impersonatedId === parseInt(impersonatedId)
    );
  }

  if (status && status !== 'all') {
    filteredSessions = filteredSessions.filter(session => session.status === status);
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredSessions = filteredSessions.filter(session => 
      new Date(session.startTime) >= start
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredSessions = filteredSessions.filter(session => 
      new Date(session.startTime) <= end
    );
  }

  // Sort by start time descending
  filteredSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Apply pagination
  const total = filteredSessions.length;
  const paginatedSessions = filteredSessions
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      sessions: paginatedSessions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get impersonation statistics
// @route   GET /api/impersonation/stats
// @access  Private (Admin/Superadmin)
const getImpersonationStats = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  let sessions = [...mockImpersonationData.sessions];

  // Filter by role permissions
  if (currentUserRole === 'admin') {
    sessions = sessions.filter(session => session.impersonatorId === currentUserId);
  }

  // Filter by time period
  const periodDays = parseInt(period);
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(session => 
    new Date(session.startTime) >= startDate
  );

  // Calculate statistics
  const stats = {
    totalSessions: recentSessions.length,
    activeSessions: recentSessions.filter(session => session.status === 'active').length,
    completedSessions: recentSessions.filter(session => session.status === 'completed').length,
    terminatedSessions: recentSessions.filter(session => session.status === 'terminated').length,
    averageDuration: recentSessions
      .filter(session => session.duration)
      .reduce((sum, session) => sum + session.duration, 0) / 
      recentSessions.filter(session => session.duration).length || 0,
    
    // Top impersonators
    topImpersonators: Object.entries(
      recentSessions.reduce((acc, session) => {
        const key = session.impersonatorId;
        acc[key] = acc[key] || {
          id: session.impersonatorId,
          name: session.impersonatorName,
          email: session.impersonatorEmail,
          count: 0
        };
        acc[key].count++;
        return acc;
      }, {})
    ).map(([_, data]) => data).sort((a, b) => b.count - a.count).slice(0, 5),

    // Most impersonated users
    mostImpersonated: Object.entries(
      recentSessions.reduce((acc, session) => {
        const key = session.impersonatedId;
        acc[key] = acc[key] || {
          id: session.impersonatedId,
          name: session.impersonatedName,
          email: session.impersonatedEmail,
          role: session.impersonatedRole,
          count: 0
        };
        acc[key].count++;
        return acc;
      }, {})
    ).map(([_, data]) => data).sort((a, b) => b.count - a.count).slice(0, 5),

    // Daily breakdown
    dailyBreakdown: (() => {
      const days = {};
      recentSessions.forEach(session => {
        const day = new Date(session.startTime).toISOString().split('T')[0];
        days[day] = (days[day] || 0) + 1;
      });
      return Object.entries(days).map(([date, count]) => ({ date, count }));
    })()
  };

  res.status(200).json({
    success: true,
    data: { stats, period: periodDays }
  });
});

// @desc    Get current active impersonations
// @route   GET /api/impersonation/current
// @access  Private (Admin/Superadmin)
const getCurrentImpersonations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  let activeSessions = mockImpersonationData.sessions.filter(session => 
    session.status === 'active'
  );

  // Filter by role permissions
  if (currentUserRole === 'admin') {
    activeSessions = activeSessions.filter(session => 
      session.impersonatorId === currentUserId
    );
  }

  // Add session duration for active sessions
  activeSessions = activeSessions.map(session => ({
    ...session,
    currentDuration: Math.floor((new Date() - new Date(session.startTime)) / 1000)
  }));

  res.status(200).json({
    success: true,
    data: {
      activeSessions,
      count: activeSessions.length
    }
  });
});

// @desc    Get impersonation session details
// @route   GET /api/impersonation/:id/details
// @access  Private (Admin/Superadmin)
const getImpersonationDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  const session = mockImpersonationData.sessions.find(s => s.id === parseInt(id));
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Impersonation session not found'
    });
  }

  // Check permissions
  if (currentUserRole === 'admin' && session.impersonatorId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient privileges to view this session'
    });
  }

  // Add additional details for the session
  const detailedSession = {
    ...session,
    auditTrail: [
      {
        timestamp: session.startTime,
        action: 'IMPERSONATION_STARTED',
        details: `Started impersonation of ${session.impersonatedName}`
      },
      ...session.actionsPerformed.map((action, index) => ({
        timestamp: new Date(session.startTime.getTime() + (index + 1) * 60000),
        action: 'USER_ACTION',
        details: action
      })),
      ...(session.endTime ? [{
        timestamp: session.endTime,
        action: 'IMPERSONATION_ENDED',
        details: `Ended impersonation session normally`
      }] : []),
      ...(session.terminatedAt ? [{
        timestamp: session.terminatedAt,
        action: 'IMPERSONATION_TERMINATED',
        details: `Session terminated: ${session.terminationReason}`
      }] : [])
    ]
  };

  res.status(200).json({
    success: true,
    data: { session: detailedSession }
  });
});

// @desc    Terminate active impersonation session
// @route   POST /api/impersonation/:id/terminate
// @access  Private (Superadmin)
const terminateImpersonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Administrative action' } = req.body;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const sessionIndex = mockImpersonationData.sessions.findIndex(s => s.id === parseInt(id));
  
  if (sessionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Impersonation session not found'
    });
  }

  const session = mockImpersonationData.sessions[sessionIndex];

  // Check if session is active
  if (session.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Session is not active and cannot be terminated'
    });
  }

  try {
    // Update session status
    const oldStatus = session.status;
    session.status = 'terminated';
    session.terminatedAt = new Date();
    session.terminatedBy = currentUserId;
    session.terminationReason = reason;
    session.actionsPerformed.push('Session terminated by administrator');

    // Log the termination
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'IMPERSONATION_TERMINATED',
      resourceType: 'IMPERSONATION_SESSION',
      resourceId: id,
      oldValues: {
        status: oldStatus,
        active: true
      },
      newValues: {
        status: 'terminated',
        terminatedBy: currentUserId,
        terminationReason: reason,
        terminatedAt: session.terminatedAt
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Impersonation session terminated successfully',
      data: {
        sessionId: session.id,
        terminatedAt: session.terminatedAt,
        reason
      }
    });
  } catch (error) {
    console.error('Error terminating impersonation session:', error);
    res.status(500).json({
      success: false,
      message: 'Error terminating impersonation session'
    });
  }
});

module.exports = {
  getImpersonationHistory,
  getImpersonationStats,
  getCurrentImpersonations,
  getImpersonationDetails,
  terminateImpersonation
};
