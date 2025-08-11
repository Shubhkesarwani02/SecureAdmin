const { dashboardMetrics, clients, vehicles, users, notifications } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get dashboard summary/overview
// @route   GET /api/dashboard/summary
// @access  Private (Superadmin)
const getDashboardSummary = asyncHandler(async (req, res) => {
  // Calculate real-time metrics
  const totalBookings = clients.reduce((sum, client) => sum + client.stats.totalBookings, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, client) => sum + client.stats.monthlyRevenue, 0);
  
  // Revenue trend (mock data for last 6 months)
  const revenueTrend = [
    { month: 'Aug', revenue: 45000 },
    { month: 'Sep', revenue: 52000 },
    { month: 'Oct', revenue: 48000 },
    { month: 'Nov', revenue: 61000 },
    { month: 'Dec', revenue: 73000 },
    { month: 'Jan', revenue: totalRevenue }
  ];

  // Client growth trend
  const clientGrowth = [
    { month: 'Aug', clients: 12 },
    { month: 'Sep', clients: 15 },
    { month: 'Oct', clients: 18 },
    { month: 'Nov', clients: 22 },
    { month: 'Dec', clients: 25 },
    { month: 'Jan', clients: clients.length }
  ];

  const summary = {
    kpis: {
      totalCompanies: clients.length,
      activeCompanies: activeClients,
      totalBookings: totalBookings,
      totalRevenue: totalRevenue,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      growth: {
        companiesGrowth: 12.5,
        revenueGrowth: 8.7,
        bookingsGrowth: 15.2,
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
    recentActivity: [
      {
        id: 1,
        type: 'client_registered',
        title: 'New Client Registration',
        description: 'Premium Fleet Services completed verification',
        timestamp: moment().subtract(2, 'hours').toISOString(),
        icon: 'user-plus'
      },
      {
        id: 2,
        type: 'payment_received',
        title: 'Payment Received',
        description: 'Elite Car Rentals paid $299 subscription fee',
        timestamp: moment().subtract(4, 'hours').toISOString(),
        icon: 'credit-card'
      },
      {
        id: 3,
        type: 'system_maintenance',
        title: 'Maintenance Completed',
        description: 'Database optimization completed successfully',
        timestamp: moment().subtract(1, 'day').toISOString(),
        icon: 'settings'
      }
    ],
    topClients: clients
      .filter(c => c.status === 'active')
      .sort((a, b) => b.stats.monthlyRevenue - a.stats.monthlyRevenue)
      .slice(0, 5)
      .map(client => ({
        id: client.id,
        name: client.companyName,
        revenue: client.stats.monthlyRevenue,
        bookings: client.stats.totalBookings,
        vehicles: client.stats.activeVehicles
      }))
  };

  res.status(200).json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString()
  });
});

// @desc    Get system monitoring data
// @route   GET /api/dashboard/monitoring
// @access  Private (Superadmin)
const getSystemMonitoring = asyncHandler(async (req, res) => {
  // Mock system monitoring data
  const monitoringData = {
    serverHealth: {
      cpu: {
        usage: 45,
        cores: 8,
        temperature: 62
      },
      memory: {
        used: 6.2,
        total: 16,
        percentage: 39
      },
      disk: {
        used: 145,
        total: 500,
        percentage: 29
      },
      network: {
        inbound: 125.6,
        outbound: 89.3,
        unit: 'MB/s'
      }
    },
    apiMetrics: {
      totalRequests: 45687,
      successfulRequests: 45598,
      failedRequests: 89,
      averageResponseTime: 145,
      requestsPerMinute: 342,
      peakRequestsPerMinute: 756
    },
    databaseHealth: {
      connections: {
        active: 23,
        idle: 7,
        max: 100
      },
      queryPerformance: {
        averageTime: 12.5,
        slowQueries: 3,
        unit: 'ms'
      },
      storage: {
        used: 2.3,
        total: 10,
        unit: 'GB'
      }
    },
    errorLogs: [
      {
        id: 1,
        level: 'error',
        message: 'Database connection timeout',
        timestamp: moment().subtract(1, 'hour').toISOString(),
        service: 'database'
      },
      {
        id: 2,
        level: 'warning',
        message: 'High API usage detected for client SV456',
        timestamp: moment().subtract(2, 'hours').toISOString(),
        service: 'api'
      },
      {
        id: 3,
        level: 'info',
        message: 'Scheduled backup completed',
        timestamp: moment().subtract(3, 'hours').toISOString(),
        service: 'backup'
      }
    ],
    uptime: {
      current: '99.9%',
      last30Days: '99.8%',
      last7Days: '100%',
      lastIncident: moment().subtract(15, 'days').toISOString()
    }
  };

  res.status(200).json({
    success: true,
    data: monitoringData,
    timestamp: new Date().toISOString()
  });
});

// @desc    Get analytics data
// @route   GET /api/dashboard/analytics
// @access  Private (Superadmin)
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Mock analytics data based on period
  const analyticsData = {
    period: period,
    userEngagement: {
      dailyActiveUsers: 1247,
      weeklyActiveUsers: 3456,
      monthlyActiveUsers: 8901,
      sessionDuration: '24.5 min',
      pageViews: 45678,
      bounceRate: '12.3%'
    },
    featureUsage: {
      aiRecommendations: 78,
      whatsappIntegration: 65,
      trackingSystem: 92,
      mobileApp: 56,
      webDashboard: 89
    },
    geographicData: [
      { country: 'United States', users: 456, percentage: 67 },
      { country: 'Canada', users: 123, percentage: 18 },
      { country: 'United Kingdom', users: 67, percentage: 10 },
      { country: 'Australia', users: 34, percentage: 5 }
    ],
    deviceBreakdown: {
      desktop: 65,
      mobile: 28,
      tablet: 7
    },
    conversionFunnel: {
      visitors: 10000,
      signups: 3500,
      activations: 2100,
      subscriptions: 890,
      conversionRate: 8.9
    }
  };

  res.status(200).json({
    success: true,
    data: analyticsData,
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  getDashboardSummary,
  getSystemMonitoring,
  getAnalytics
};