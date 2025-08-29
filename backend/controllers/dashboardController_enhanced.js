const { asyncHandler } = require('../middleware/errorHandler');
const { 
  userService, 
  accountService, 
  auditService 
} = require('../services/database');
const moment = require('moment');

// @desc    Get dashboard summary/overview
// @route   GET /api/dashboard/summary
// @access  Private (Superadmin)
const getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    // Get real data from database
    const [usersResult, accountsResult, recentAuditLogs] = await Promise.all([
      userService.getAll({ limit: 1000 }),
      accountService.getAll({ limit: 1000 }),
      auditService.getLogs({ limit: 10 })
    ]);

    const users = usersResult.users || [];
    const accounts = accountsResult.accounts || [];
    const auditLogs = recentAuditLogs.logs || [];

    // Calculate real-time metrics
    const activeAccounts = accounts.filter(a => a.status === 'active');
    const totalRevenue = activeAccounts.reduce((sum, account) => {
      // Assuming subscription_plan determines revenue
      const planRevenue = {
        'basic': 99,
        'professional': 199,
        'enterprise': 299
      };
      return sum + (planRevenue[account.subscription_plan] || 0);
    }, 0);

    // Generate revenue trend for last 6 months (simplified)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, 'months');
      revenueTrend.push({
        month: month.format('MMM'),
        revenue: Math.floor(totalRevenue * (0.8 + Math.random() * 0.4)) // Simulate variation
      });
    }

    // Client growth trend
    const clientGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, 'months');
      const monthAccounts = accounts.filter(a => 
        moment(a.created_at).isBefore(month.endOf('month'))
      );
      clientGrowth.push({
        month: month.format('MMM'),
        clients: monthAccounts.length
      });
    }

    // Convert audit logs to recent activity
    const recentActivity = auditLogs.slice(0, 5).map((log, index) => ({
      id: index + 1,
      type: log.action.toLowerCase().replace('_', '_'),
      title: log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `${log.action} performed by user`,
      timestamp: log.created_at,
      icon: getActivityIcon(log.action)
    }));

    // Get top clients by revenue
    const topClients = activeAccounts
      .sort((a, b) => {
        const aRevenue = getPlanRevenue(a.subscription_plan);
        const bRevenue = getPlanRevenue(b.subscription_plan);
        return bRevenue - aRevenue;
      })
      .slice(0, 5)
      .map(account => ({
        id: account.id,
        name: account.name,
        revenue: getPlanRevenue(account.subscription_plan),
        status: account.status,
        createdAt: account.created_at
      }));

    const summary = {
      kpis: {
        totalCompanies: accounts.length,
        activeCompanies: activeAccounts.length,
        totalUsers: users.length,
        totalRevenue: totalRevenue,
        growth: {
          companiesGrowth: calculateGrowth(accounts, 'created_at'),
          revenueGrowth: 8.7, // Simplified
          period: 'vs last month'
        }
      },
      trends: {
        revenue: revenueTrend,
        clients: clientGrowth
      },
      systemHealth: {
        status: 'operational',
        uptime: '99.9%',
        apiResponseTime: '145ms',
        errorRate: '0.02%',
        lastUpdate: new Date().toISOString()
      },
      recentActivity,
      topClients
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private (Superadmin)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  try {
    const [usersResult, accountsResult] = await Promise.all([
      userService.getAll({ limit: 1000 }),
      accountService.getAll({ limit: 1000 })
    ]);

    const users = usersResult.users || [];
    const accounts = accountsResult.accounts || [];

    const metrics = {
      overview: {
        totalCompanies: accounts.length,
        activeCompanies: accounts.filter(a => a.status === 'active').length,
        totalUsers: users.length,
        totalRevenue: accounts.filter(a => a.status === 'active')
          .reduce((sum, a) => sum + getPlanRevenue(a.subscription_plan), 0)
      },
      systemHealth: {
        apiStatus: "operational",
        databaseStatus: "operational",
        uptime: "99.9%",
        responseTime: "145ms",
        errorRate: "0.02%"
      },
      recentActivity: [
        {
          id: 1,
          type: "client_registered",
          message: "New client registration completed",
          timestamp: moment().subtract(2, 'hours').toISOString()
        },
        {
          id: 2,
          type: "payment_received",
          message: "Payment received from client",
          timestamp: moment().subtract(4, 'hours').toISOString()
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard metrics'
    });
  }
});

// Helper functions
function getPlanRevenue(plan) {
  const planRevenue = {
    'basic': 99,
    'professional': 199,
    'enterprise': 299
  };
  return planRevenue[plan] || 0;
}

function getActivityIcon(action) {
  const iconMap = {
    'LOGIN_SUCCESS': 'user',
    'USER_CREATED': 'user-plus',
    'CLIENT_CREATED': 'building',
    'PAYMENT_RECEIVED': 'credit-card',
    'SYSTEM_MAINTENANCE': 'settings'
  };
  return iconMap[action] || 'activity';
}

function calculateGrowth(items, dateField) {
  const now = moment();
  const lastMonth = moment().subtract(1, 'month');
  
  const currentCount = items.filter(item => 
    moment(item[dateField]).isAfter(lastMonth)
  ).length;
  
  const previousCount = items.filter(item => 
    moment(item[dateField]).isBetween(
      moment().subtract(2, 'months'), 
      lastMonth
    )
  ).length;
  
  if (previousCount === 0) return currentCount > 0 ? 100 : 0;
  return Math.round(((currentCount - previousCount) / previousCount) * 100);
}

// @desc    Get system monitoring data
// @route   GET /api/dashboard/monitoring
// @access  Private (Superadmin)
const getSystemMonitoring = asyncHandler(async (req, res) => {
  try {
    // Simulate system metrics - in production, these would come from actual monitoring services
    const systemMetrics = {
      server: {
        cpu: {
          usage: Math.floor(Math.random() * 50) + 20, // 20-70%
          cores: 4,
          load: Math.random() * 2
        },
        memory: {
          total: 16, // GB
          used: Math.floor(Math.random() * 8) + 4, // 4-12 GB
          free: null // calculated
        },
        disk: {
          total: 500, // GB
          used: Math.floor(Math.random() * 200) + 100, // 100-300 GB
          free: null // calculated
        },
        uptime: Math.floor(Math.random() * 720) + 24 // 24-744 hours
      },
      database: {
        connections: {
          active: Math.floor(Math.random() * 10) + 5,
          idle: Math.floor(Math.random() * 20) + 10,
          max: 100
        },
        queries: {
          total: Math.floor(Math.random() * 10000) + 5000,
          slow: Math.floor(Math.random() * 50) + 10,
          avgResponseTime: Math.random() * 100 + 50 // ms
        }
      },
      api: {
        requests: {
          total: Math.floor(Math.random() * 50000) + 10000,
          successful: Math.floor(Math.random() * 45000) + 9500,
          failed: Math.floor(Math.random() * 500) + 100
        },
        responseTime: {
          avg: Math.random() * 200 + 100, // ms
          p95: Math.random() * 500 + 200,
          p99: Math.random() * 1000 + 500
        }
      }
    };

    // Calculate derived values
    systemMetrics.server.memory.free = systemMetrics.server.memory.total - systemMetrics.server.memory.used;
    systemMetrics.server.disk.free = systemMetrics.server.disk.total - systemMetrics.server.disk.used;

    res.status(200).json({
      success: true,
      data: systemMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting system monitoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system monitoring data'
    });
  }
});

// @desc    Get analytics data
// @route   GET /api/dashboard/analytics
// @access  Private (Superadmin)
const getAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get analytics data from database
    const [usersResult, accountsResult, auditResult] = await Promise.all([
      userService.getAll({ limit: 1000 }),
      accountService.getAll({ limit: 1000 }),
      auditService.getLogs({ limit: 1000 })
    ]);

    const users = usersResult.users || [];
    const accounts = accountsResult.accounts || [];
    const auditLogs = auditResult.logs || [];

    // User analytics
    const userAnalytics = {
      totalUsers: users.length,
      byRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      newUsersLast30Days: users.filter(user => 
        moment(user.created_at).isAfter(moment().subtract(30, 'days'))
      ).length,
      activeUsersLast7Days: users.filter(user => 
        moment(user.last_login_at).isAfter(moment().subtract(7, 'days'))
      ).length
    };

    // Account analytics
    const accountAnalytics = {
      totalAccounts: accounts.length,
      byStatus: accounts.reduce((acc, account) => {
        acc[account.status || 'active'] = (acc[account.status || 'active'] || 0) + 1;
        return acc;
      }, {}),
      newAccountsLast30Days: accounts.filter(account => 
        moment(account.created_at).isAfter(moment().subtract(30, 'days'))
      ).length
    };

    // Activity analytics
    const activityAnalytics = {
      totalActions: auditLogs.length,
      actionsByType: auditLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
      actionsLast24Hours: auditLogs.filter(log => 
        moment(log.created_at).isAfter(moment().subtract(24, 'hours'))
      ).length
    };

    // Generate daily activity for last 30 days
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dayStart = date.startOf('day');
      const dayEnd = date.endOf('day');
      
      const dayLogs = auditLogs.filter(log => 
        moment(log.created_at).isBetween(dayStart, dayEnd)
      );
      
      dailyActivity.push({
        date: date.format('YYYY-MM-DD'),
        activities: dayLogs.length,
        users: [...new Set(dayLogs.map(log => log.user_id))].length
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users: userAnalytics,
        accounts: accountAnalytics,
        activity: activityAnalytics,
        trends: {
          dailyActivity
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data'
    });
  }
});

module.exports = {
  getDashboardSummary,
  getDashboardMetrics,
  getSystemMonitoring,
  getAnalytics
};
