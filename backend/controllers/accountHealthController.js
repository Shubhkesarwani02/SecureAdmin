// Account Health Controller
// Handles account health monitoring, scoring, and alerts for the Framtt Superadmin Dashboard

const { asyncHandler } = require('../middleware/errorHandler');

// Mock database - In real implementation, this would be your database connection
const mockAccountHealthData = {
  healthScores: [
    {
      id: 1,
      clientId: 1,
      companyName: 'Premium Fleet Services',
      overallScore: 92,
      usageScore: 95,
      engagementScore: 90,
      financialScore: 95,
      supportScore: 88,
      riskLevel: 'low',
      healthTrend: 'improving',
      churnProbability: 5.0,
      daysSinceLastActivity: 0,
      featureAdoptionRate: 85.5,
      lastHealthCheck: new Date().toISOString(),
      activeAlerts: 0,
      criticalAlerts: 0
    },
    {
      id: 2,
      clientId: 2,
      companyName: 'Elite Car Rentals',
      overallScore: 87,
      usageScore: 90,
      engagementScore: 85,
      financialScore: 88,
      supportScore: 85,
      riskLevel: 'low',
      healthTrend: 'stable',
      churnProbability: 8.5,
      daysSinceLastActivity: 1,
      featureAdoptionRate: 78.2,
      lastHealthCheck: new Date().toISOString(),
      activeAlerts: 1,
      criticalAlerts: 0
    },
    {
      id: 3,
      clientId: 3,
      companyName: 'Coastal Vehicle Co',
      overallScore: 75,
      usageScore: 80,
      engagementScore: 70,
      financialScore: 78,
      supportScore: 72,
      riskLevel: 'medium',
      healthTrend: 'stable',
      churnProbability: 18.0,
      daysSinceLastActivity: 2,
      featureAdoptionRate: 65.8,
      lastHealthCheck: new Date().toISOString(),
      activeAlerts: 1,
      criticalAlerts: 0
    },
    {
      id: 4,
      clientId: 4,
      companyName: 'Metro Transit Solutions',
      overallScore: 68,
      usageScore: 65,
      engagementScore: 70,
      financialScore: 75,
      supportScore: 62,
      riskLevel: 'medium',
      healthTrend: 'declining',
      churnProbability: 25.5,
      daysSinceLastActivity: 5,
      featureAdoptionRate: 45.2,
      lastHealthCheck: new Date().toISOString(),
      activeAlerts: 2,
      criticalAlerts: 0
    },
    {
      id: 5,
      clientId: 5,
      companyName: 'Sunshine Auto Rental',
      overallScore: 45,
      usageScore: 40,
      engagementScore: 35,
      financialScore: 55,
      supportScore: 50,
      riskLevel: 'critical',
      healthTrend: 'critical',
      churnProbability: 65.0,
      daysSinceLastActivity: 14,
      featureAdoptionRate: 22.1,
      lastHealthCheck: new Date().toISOString(),
      activeAlerts: 1,
      criticalAlerts: 1
    }
  ],
  
  alerts: [
    {
      id: 1,
      clientId: 4,
      companyName: 'Metro Transit Solutions',
      alertType: 'churn_risk',
      severity: 'high',
      title: 'High Churn Risk Detected',
      description: 'Metro Transit Solutions showing declining engagement and support issues',
      metricValue: 68.0,
      thresholdValue: 70.0,
      recommendedAction: 'Schedule immediate check-in call and review account needs',
      status: 'active',
      assignedTo: 'CSM Team',
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 2,
      clientId: 5,
      companyName: 'Sunshine Auto Rental',
      alertType: 'low_engagement',
      severity: 'critical',
      title: 'Critical Low Engagement',
      description: 'Sunshine Auto Rental has not logged in for 14 days',
      metricValue: 45.0,
      thresholdValue: 60.0,
      recommendedAction: 'Urgent: Contact immediately and offer onboarding assistance',
      status: 'active',
      assignedTo: 'Account Manager',
      createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: 3,
      clientId: 4,
      companyName: 'Metro Transit Solutions',
      alertType: 'support_spike',
      severity: 'medium',
      title: 'Increased Support Requests',
      description: 'Support ticket volume increased by 40% this month',
      metricValue: 8.0,
      thresholdValue: 5.0,
      recommendedAction: 'Review common issues and provide proactive support',
      status: 'acknowledged',
      assignedTo: 'Support Team',
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 4,
      clientId: 3,
      companyName: 'Coastal Vehicle Co',
      alertType: 'feature_adoption',
      severity: 'medium',
      title: 'Low Feature Adoption',
      description: 'Missing key integrations - only 2 of 4 features enabled',
      metricValue: 65.8,
      thresholdValue: 75.0,
      recommendedAction: 'Schedule feature demo and implementation support',
      status: 'active',
      assignedTo: 'CSM Team',
      createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 5,
      clientId: 2,
      companyName: 'Elite Car Rentals',
      alertType: 'contract_renewal',
      severity: 'low',
      title: 'Contract Renewal Approaching',
      description: 'Contract renewal due in 45 days',
      metricValue: 87.0,
      thresholdValue: 90.0,
      recommendedAction: 'Prepare renewal proposal and schedule discussion',
      status: 'active',
      assignedTo: 'Account Manager',
      createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    }
  ],

  engagementMetrics: [
    {
      clientId: 1,
      companyName: 'Premium Fleet Services',
      dailyActiveUsers: 45,
      weeklyActiveUsers: 180,
      monthlyActiveUsers: 450,
      sessionDurationAvg: 25.5,
      pageViews: 1250,
      featureInteractions: 890,
      apiCalls: 2400,
      bookingConversions: 234,
      revenueGenerated: 15750.00,
      npsScore: 85,
      csatScore: 5
    },
    {
      clientId: 2,
      companyName: 'Elite Car Rentals',
      dailyActiveUsers: 32,
      weeklyActiveUsers: 145,
      monthlyActiveUsers: 380,
      sessionDurationAvg: 22.8,
      pageViews: 980,
      featureInteractions: 650,
      apiCalls: 1800,
      bookingConversions: 189,
      revenueGenerated: 12300.00,
      npsScore: 78,
      csatScore: 4
    },
    {
      clientId: 3,
      companyName: 'Coastal Vehicle Co',
      dailyActiveUsers: 28,
      weeklyActiveUsers: 120,
      monthlyActiveUsers: 285,
      sessionDurationAvg: 18.2,
      pageViews: 750,
      featureInteractions: 420,
      apiCalls: 1200,
      bookingConversions: 156,
      revenueGenerated: 9800.00,
      npsScore: 72,
      csatScore: 4
    },
    {
      clientId: 4,
      companyName: 'Metro Transit Solutions',
      dailyActiveUsers: 18,
      weeklyActiveUsers: 85,
      monthlyActiveUsers: 220,
      sessionDurationAvg: 15.5,
      pageViews: 450,
      featureInteractions: 280,
      apiCalls: 800,
      bookingConversions: 98,
      revenueGenerated: 6500.00,
      npsScore: 65,
      csatScore: 3
    },
    {
      clientId: 5,
      companyName: 'Sunshine Auto Rental',
      dailyActiveUsers: 12,
      weeklyActiveUsers: 45,
      monthlyActiveUsers: 150,
      sessionDurationAvg: 12.1,
      pageViews: 280,
      featureInteractions: 120,
      apiCalls: 350,
      bookingConversions: 67,
      revenueGenerated: 4200.00,
      npsScore: 45,
      csatScore: 3
    }
  ]
};

// GET /api/account-health/overview
const getAccountHealthOverview = (req, res) => {
  try {
    const overview = {
      totalClients: mockAccountHealthData.healthScores.length,
      healthyClients: mockAccountHealthData.healthScores.filter(score => score.riskLevel === 'low').length,
      atRiskClients: mockAccountHealthData.healthScores.filter(score => score.riskLevel === 'medium').length,
      criticalClients: mockAccountHealthData.healthScores.filter(score => score.riskLevel === 'critical').length,
      averageHealthScore: Math.round(
        mockAccountHealthData.healthScores.reduce((sum, score) => sum + score.overallScore, 0) / 
        mockAccountHealthData.healthScores.length
      ),
      totalActiveAlerts: mockAccountHealthData.alerts.filter(alert => alert.status === 'active').length,
      criticalAlerts: mockAccountHealthData.alerts.filter(alert => alert.severity === 'critical').length,
      churnRiskClients: mockAccountHealthData.healthScores.filter(score => score.churnProbability > 30).length,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching account health overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account health overview',
      error: error.message
    });
  }
};

// GET /api/account-health/scores
const getAccountHealthScores = (req, res) => {
  try {
    const { riskLevel, sortBy = 'overallScore', sortOrder = 'asc' } = req.query;
    
    let filteredScores = [...mockAccountHealthData.healthScores];
    
    // Filter by risk level if specified
    if (riskLevel) {
      filteredScores = filteredScores.filter(score => score.riskLevel === riskLevel);
    }
    
    // Sort results
    filteredScores.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      
      if (sortOrder === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });

    res.json({
      success: true,
      data: filteredScores,
      total: filteredScores.length
    });
  } catch (error) {
    console.error('Error fetching account health scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account health scores',
      error: error.message
    });
  }
};

// GET /api/account-health/alerts
const getAccountHealthAlerts = (req, res) => {
  try {
    const { status, severity, clientId, alertType } = req.query;
    
    let filteredAlerts = [...mockAccountHealthData.alerts];
    
    // Apply filters
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (clientId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.clientId === parseInt(clientId));
    }
    if (alertType) {
      filteredAlerts = filteredAlerts.filter(alert => alert.alertType === alertType);
    }
    
    // Sort by creation date (most recent first)
    filteredAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length
    });
  } catch (error) {
    console.error('Error fetching account health alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account health alerts',
      error: error.message
    });
  }
};

// GET /api/account-health/client/:clientId
const getClientHealthDetails = (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    const healthScore = mockAccountHealthData.healthScores.find(score => score.clientId === clientId);
    const clientAlerts = mockAccountHealthData.alerts.filter(alert => alert.clientId === clientId);
    const engagementMetrics = mockAccountHealthData.engagementMetrics.find(metrics => metrics.clientId === clientId);
    
    if (!healthScore) {
      return res.status(404).json({
        success: false,
        message: 'Client health data not found'
      });
    }

    res.json({
      success: true,
      data: {
        healthScore,
        alerts: clientAlerts,
        engagementMetrics: engagementMetrics || null
      }
    });
  } catch (error) {
    console.error('Error fetching client health details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client health details',
      error: error.message
    });
  }
};

// POST /api/account-health/alerts/:alertId/acknowledge
const acknowledgeAlert = (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const { acknowledgedBy } = req.body;
    
    const alertIndex = mockAccountHealthData.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    mockAccountHealthData.alerts[alertIndex] = {
      ...mockAccountHealthData.alerts[alertIndex],
      status: 'acknowledged',
      acknowledgedBy: acknowledgedBy || 'Current User',
      acknowledgedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: mockAccountHealthData.alerts[alertIndex]
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message
    });
  }
};

// POST /api/account-health/alerts/:alertId/resolve
const resolveAlert = (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const { resolvedBy } = req.body;
    
    const alertIndex = mockAccountHealthData.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    mockAccountHealthData.alerts[alertIndex] = {
      ...mockAccountHealthData.alerts[alertIndex],
      status: 'resolved',
      resolvedBy: resolvedBy || 'Current User',
      resolvedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: mockAccountHealthData.alerts[alertIndex]
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
};

// GET /api/account-health/high-risk
const getHighRiskClients = (req, res) => {
  try {
    const highRiskClients = mockAccountHealthData.healthScores
      .filter(score => score.riskLevel === 'high' || score.riskLevel === 'critical' || score.churnProbability > 30)
      .sort((a, b) => b.churnProbability - a.churnProbability);

    res.json({
      success: true,
      data: highRiskClients,
      total: highRiskClients.length
    });
  } catch (error) {
    console.error('Error fetching high-risk clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch high-risk clients',
      error: error.message
    });
  }
};

// POST /api/account-health/refresh-scores
const refreshHealthScores = asyncHandler(async (req, res) => {
  // In a real implementation, this would trigger the health score calculation
  // For demo purposes, we'll just update the lastHealthCheck timestamp
  mockAccountHealthData.healthScores.forEach(score => {
    score.lastHealthCheck = new Date().toISOString();
  });

  res.json({
    success: true,
    message: 'Health scores refreshed successfully',
    data: {
      updatedCount: mockAccountHealthData.healthScores.length,
      lastRefresh: new Date().toISOString()
    }
  });
});

module.exports = {
  getAccountHealthOverview,
  getAccountHealthScores,
  getAccountHealthAlerts,
  getClientHealthDetails,
  acknowledgeAlert,
  resolveAlert,
  getHighRiskClients,
  refreshHealthScores
};