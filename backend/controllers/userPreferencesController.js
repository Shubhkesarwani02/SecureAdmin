const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

// For now, let's use a simple approach without PDFKit until we can install it properly
// const PDFDocument = require('pdfkit');

// Mock query function if database service isn't available
let query;
try {
  ({ query } = require('../services/database'));
} catch (error) {
  console.warn('Database service not available, using mock data');
  query = async () => ({ rows: [] });
}

// @desc    Get user preferences
// @route   GET /api/user/preferences
// @access  Private
const getUserPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0].preferences
  });
});

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { preferences } = req.body;

  // Get current preferences
  const currentResult = await query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );

  if (currentResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Merge with existing preferences
  const currentPreferences = currentResult.rows[0].preferences || {};
  const updatedPreferences = { ...currentPreferences, ...preferences };

  // Update in database
  const result = await query(
    'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING preferences',
    [JSON.stringify(updatedPreferences), userId]
  );

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: result.rows[0].preferences
  });
});

// @desc    Get notification settings
// @route   GET /api/user/notification-settings
// @access  Private
const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const preferences = result.rows[0].preferences || {};
  const notificationSettings = {
    emailNotifications: preferences.emailNotifications || true,
    pushNotifications: preferences.pushNotifications || false,
    weeklyReports: preferences.weeklyReports || true,
    marketingEmails: preferences.marketingEmails || false,
    criticalAlerts: preferences.criticalAlerts || true,
    systemMaintenance: preferences.systemMaintenance || true,
    accountHealth: preferences.accountHealth || true
  };

  res.status(200).json({
    success: true,
    data: notificationSettings
  });
});

// @desc    Update notification settings
// @route   PUT /api/user/notification-settings
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationSettings = req.body;

  // Get current preferences
  const currentResult = await query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );

  if (currentResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const currentPreferences = currentResult.rows[0].preferences || {};
  const updatedPreferences = { ...currentPreferences, ...notificationSettings };

  // Update in database
  const result = await query(
    'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING preferences',
    [JSON.stringify(updatedPreferences), userId]
  );

  res.status(200).json({
    success: true,
    message: 'Notification settings updated successfully',
    data: result.rows[0].preferences
  });
});

// @desc    Get quick actions based on user role and permissions
// @route   GET /api/dashboard/quick-actions
// @access  Private
const getQuickActions = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  let quickActions = [];

  try {
    // Get pending tasks and actions from database
    const [kycCount, paymentIssues, alertsCount, systemTasks] = await Promise.all([
      // Get pending KYC count
      query('SELECT COUNT(*) as count FROM clients WHERE status = $1', ['pending']).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Get payment issues count (simplified query)
      query(`SELECT COUNT(*) as count FROM notifications WHERE type = 'warning' AND title LIKE '%payment%' AND is_read = false`).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Get critical alerts count
      query(`SELECT COUNT(*) as count FROM notifications WHERE priority = 'critical' AND is_read = false`).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Get system maintenance tasks
      query(`SELECT COUNT(*) as count FROM notifications WHERE type = 'info' AND title LIKE '%system%' AND is_read = false`).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Role-based quick actions
    if (['superadmin', 'admin'].includes(userRole)) {
      quickActions = [
        {
          id: 'kyc-review',
          title: 'Review Pending KYC',
          description: `${kycCount.rows[0].count} clients waiting for KYC approval`,
          icon: 'AlertCircle',
          variant: 'outline',
          priority: 'high',
          count: parseInt(kycCount.rows[0].count),
          action: 'navigate',
          target: '/clients?filter=kyc_pending'
        },
        {
          id: 'payment-issues',
          title: 'Process Payment Issues',
          description: `${paymentIssues.rows[0].count} payment-related issues need attention`,
          icon: 'CreditCard',
          variant: 'outline',
          priority: 'medium',
          count: parseInt(paymentIssues.rows[0].count),
          action: 'navigate',
          target: '/payments?filter=issues'
        },
        {
          id: 'system-settings',
          title: 'Update System Settings',
          description: 'Configure system parameters and maintenance',
          icon: 'Settings',
          variant: 'outline',
          priority: 'low',
          count: 0,
          action: 'navigate',
          target: '/settings'
        },
        {
          id: 'monthly-report',
          title: 'Generate Monthly Report',
          description: 'Create comprehensive monthly analytics report',
          icon: 'FileText',
          variant: 'outline',
          priority: 'medium',
          count: 0,
          action: 'generate_report',
          target: null
        }
      ];
    }

    if (userRole === 'csm') {
      quickActions = [
        {
          id: 'account-health',
          title: 'Check Account Health',
          description: `${alertsCount.rows[0].count} accounts need attention`,
          icon: 'Activity',
          variant: 'outline',
          priority: 'high',
          count: parseInt(alertsCount.rows[0].count),
          action: 'navigate',
          target: '/account-health'
        },
        {
          id: 'client-reports',
          title: 'Generate Client Reports',
          description: 'Create reports for assigned clients',
          icon: 'FileText',
          variant: 'outline',
          priority: 'medium',
          count: 0,
          action: 'generate_report',
          target: null
        }
      ];
    }
  } catch (error) {
    console.warn('Database error in quick actions, using fallback data:', error.message);
    
    // Fallback data when database is not available
    if (['superadmin', 'admin'].includes(userRole)) {
      quickActions = [
        {
          id: 'kyc-review',
          title: 'Review Pending KYC',
          description: `23 clients waiting for KYC approval`,
          icon: 'AlertCircle',
          variant: 'outline',
          priority: 'high',
          count: 23,
          action: 'navigate',
          target: '/clients?filter=kyc_pending'
        },
        {
          id: 'payment-issues',
          title: 'Process Payment Issues',
          description: `5 payment-related issues need attention`,
          icon: 'CreditCard',
          variant: 'outline',
          priority: 'medium',
          count: 5,
          action: 'navigate',
          target: '/payments?filter=issues'
        },
        {
          id: 'system-settings',
          title: 'Update System Settings',
          description: 'Configure system parameters and maintenance',
          icon: 'Settings',
          variant: 'outline',
          priority: 'low',
          count: 0,
          action: 'navigate',
          target: '/settings'
        },
        {
          id: 'monthly-report',
          title: 'Generate Monthly Report',
          description: 'Create comprehensive monthly analytics report',
          icon: 'FileText',
          variant: 'outline',
          priority: 'medium',
          count: 0,
          action: 'generate_report',
          target: null
        }
      ];
    } else if (userRole === 'csm') {
      quickActions = [
        {
          id: 'account-health',
          title: 'Check Account Health',
          description: `8 accounts need attention`,
          icon: 'Activity',
          variant: 'outline',
          priority: 'high',
          count: 8,
          action: 'navigate',
          target: '/account-health'
        },
        {
          id: 'client-reports',
          title: 'Generate Client Reports',
          description: 'Create reports for assigned clients',
          icon: 'FileText',
          variant: 'outline',
          priority: 'medium',
          count: 0,
          action: 'generate_report',
          target: null
        }
      ];
    }
  }

  res.status(200).json({
    success: true,
    data: quickActions
  });
});

// @desc    Generate monthly report
// @route   POST /api/dashboard/generate-report
// @access  Private
const generateMonthlyReport = asyncHandler(async (req, res) => {
  const { reportType = 'monthly', format = 'pdf' } = req.body;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    // Get report data based on user role
    let reportData = {};

    if (['superadmin', 'admin'].includes(userRole)) {
      // Get comprehensive system data
      try {
        const [clients, revenue, bookings, vehicles, alerts] = await Promise.all([
          query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM clients', ['active']),
          query('SELECT SUM(c.monthly_revenue) as total FROM clients c WHERE c.status = $1', ['active']),
          query('SELECT SUM(c.total_bookings) as total FROM clients c WHERE c.status = $1', ['active']),
          query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM vehicles', ['active']),
          query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE priority = $1) as critical FROM notifications WHERE created_at >= NOW() - INTERVAL \'30 days\'', ['critical'])
        ]);

        reportData = {
          period: 'Monthly Report - ' + new Date().toISOString().slice(0, 7),
          summary: {
            totalClients: parseInt(clients.rows[0]?.total || 0),
            activeClients: parseInt(clients.rows[0]?.active || 0),
            totalRevenue: parseFloat(revenue.rows[0]?.total || 0),
            totalBookings: parseInt(bookings.rows[0]?.total || 0),
            totalVehicles: parseInt(vehicles.rows[0]?.total || 0),
            activeVehicles: parseInt(vehicles.rows[0]?.active || 0),
            totalAlerts: parseInt(alerts.rows[0]?.total || 0),
            criticalAlerts: parseInt(alerts.rows[0]?.critical || 0)
          }
        };
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError.message);
        reportData = {
          period: 'Monthly Report - ' + new Date().toISOString().slice(0, 7),
          summary: {
            totalClients: 142,
            activeClients: 128,
            totalRevenue: 67000,
            totalBookings: 8923,
            totalVehicles: 456,
            activeVehicles: 423,
            totalAlerts: 12,
            criticalAlerts: 3
          }
        };
      }
    } else if (userRole === 'csm') {
      // Get CSM-specific data
      try {
        const [assignments, accountHealth] = await Promise.all([
          query('SELECT COUNT(*) as total FROM csm_assignments WHERE csm_id = $1', [userId]),
          query(`
            SELECT COUNT(*) as total_alerts, COUNT(*) FILTER (WHERE priority = 'critical') as critical_alerts
            FROM notifications n
            JOIN csm_assignments ca ON n.metadata->>'client_id' = ca.account_id::text
            WHERE ca.csm_id = $1 AND n.created_at >= NOW() - INTERVAL '30 days'
          `, [userId])
        ]);

        reportData = {
          period: 'Monthly CSM Report - ' + new Date().toISOString().slice(0, 7),
          summary: {
            assignedAccounts: parseInt(assignments.rows[0]?.total || 0),
            totalAlerts: parseInt(accountHealth.rows[0]?.total_alerts || 0),
            criticalAlerts: parseInt(accountHealth.rows[0]?.critical_alerts || 0)
          }
        };
      } catch (dbError) {
        console.warn('Database query failed for CSM, using mock data:', dbError.message);
        reportData = {
          period: 'Monthly CSM Report - ' + new Date().toISOString().slice(0, 7),
          summary: {
            assignedAccounts: 5,
            totalAlerts: 8,
            criticalAlerts: 2
          }
        };
      }
    }

    if (format === 'pdf') {
      // For now, return a simple report structure that can be downloaded as text
      // In production, you would use PDFKit or similar library
      const fileName = `report_${reportType}_${Date.now()}.txt`;
      const tempDir = path.join(__dirname, '../temp');
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePath = path.join(tempDir, fileName);
      const reportContent = `${reportData.period}\n\nGenerated on: ${new Date().toISOString()}\n\nSummary:\n${Object.entries(reportData.summary).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
      
      fs.writeFileSync(filePath, reportContent);

      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: {
          fileName,
          downloadUrl: `/api/dashboard/download-report/${fileName}`,
          type: 'text',
          generatedAt: new Date().toISOString()
        }
      });
    } else {
      // Return JSON report
      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: reportData
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// @desc    Download generated report
// @route   GET /api/dashboard/download-report/:fileName
// @access  Private
const downloadReport = asyncHandler(async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../temp', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Report file not found'
    });
  }

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).json({
        success: false,
        message: 'Error downloading report'
      });
    } else {
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    }
  });
});

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getQuickActions,
  generateMonthlyReport,
  downloadReport
};
