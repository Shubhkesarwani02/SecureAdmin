const { asyncHandler } = require('../middleware/errorHandler');
const { auditService, impersonationService } = require('../services/database');

// @desc    Get audit logs
// @route   GET /api/audit/logs
// @access  Private (Admin/Superadmin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    userId,
    action,
    resourceType,
    page = 1,
    limit = 20,
    startDate,
    endDate
  } = req.query;

  const currentUserRole = req.user.role;

  // Only admin and superadmin can view audit logs
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view audit logs.'
    });
  }

  const options = {
    userId,
    action,
    resourceType,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    startDate,
    endDate
  };

  const result = await auditService.getLogs(options);

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get impersonation logs
// @route   GET /api/audit/impersonation
// @access  Private (Admin/Superadmin)
const getImpersonationLogs = asyncHandler(async (req, res) => {
  const {
    impersonatorId,
    impersonatedId,
    page = 1,
    limit = 20,
    startDate,
    endDate
  } = req.query;

  const currentUserRole = req.user.role;

  // Only admin and superadmin can view impersonation logs
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view impersonation logs.'
    });
  }

  const options = {
    impersonatorId,
    impersonatedId,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    startDate,
    endDate
  };

  const result = await impersonationService.getHistory(options);

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private (Admin/Superadmin)
const getAuditStats = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  // Only admin and superadmin can view audit statistics
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view audit statistics.'
    });
  }

  try {
    const { query } = require('../services/database');

    // Get audit log statistics
    const auditStatsResult = await query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN action LIKE '%LOGIN%' THEN 1 END) as login_events,
        COUNT(CASE WHEN action LIKE '%CREATE%' THEN 1 END) as create_events,
        COUNT(CASE WHEN action LIKE '%UPDATE%' THEN 1 END) as update_events,
        COUNT(CASE WHEN action LIKE '%DELETE%' THEN 1 END) as delete_events,
        COUNT(CASE WHEN impersonator_id IS NOT NULL THEN 1 END) as impersonation_events,
        DATE_TRUNC('day', created_at) as log_date
      FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY log_date DESC
      LIMIT 30
    `);

    // Get impersonation statistics
    const impersonationStatsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
        COUNT(CASE WHEN end_time IS NOT NULL THEN 1 END) as completed_sessions,
        AVG(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))/60) as avg_session_minutes
      FROM impersonation_logs 
      WHERE start_time >= NOW() - INTERVAL '30 days'
    `);

    // Get most active users
    const activeUsersResult = await query(`
      SELECT 
        u.full_name,
        u.email,
        u.role,
        COUNT(al.id) as log_count
      FROM audit_logs al
      INNER JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.full_name, u.email, u.role
      ORDER BY log_count DESC
      LIMIT 10
    `);

    const stats = {
      auditLogs: auditStatsResult.rows,
      impersonation: impersonationStatsResult.rows[0] || {
        total_sessions: 0,
        active_sessions: 0,
        completed_sessions: 0,
        avg_session_minutes: 0
      },
      activeUsers: activeUsersResult.rows
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit statistics'
    });
  }
});

// @desc    Export audit logs
// @route   GET /api/audit/export
// @access  Private (Superadmin only)
const exportAuditLogs = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    format = 'json'
  } = req.query;

  const currentUserRole = req.user.role;

  // Only superadmin can export audit logs
  if (currentUserRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only superadmin can export audit logs.'
    });
  }

  try {
    const { query } = require('../services/database');
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      whereClause += ` AND al.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND al.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const result = await query(`
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email,
        imp.full_name as impersonator_name,
        imp.email as impersonator_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN users imp ON al.impersonator_id = imp.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `, params);

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      res.send(csv);
    } else {
      res.status(200).json({
        success: true,
        data: {
          logs: result.rows,
          count: result.rows.length,
          exportedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs'
    });
  }
});

// Helper function to convert array to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  getAuditLogs,
  getImpersonationLogs,
  getAuditStats,
  exportAuditLogs
};
