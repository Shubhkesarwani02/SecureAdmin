const { users, integrationCodes, notifications } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private (Superadmin)
const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = {
    general: {
      platformName: 'Framtt Admin',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: false
    },
    security: {
      sessionTimeout: 8, // hours
      maxLoginAttempts: 5,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      twoFactorRequired: false,
      ipWhitelist: []
    },
    notifications: {
      emailNotifications: true,
      slackIntegration: false,
      webhookUrl: '',
      criticalAlerts: true,
      dailyReports: true
    },
    integrations: {
      stripeEnabled: true,
      twilioEnabled: false,
      slackEnabled: false,
      analyticsEnabled: true
    },
    limits: {
      maxClientsPerAdmin: 100,
      maxVehiclesPerClient: 500,
      apiRateLimit: 1000, // requests per hour
      storageLimit: '10GB'
    }
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private (Superadmin)
const updateAdminSettings = asyncHandler(async (req, res) => {
  // In a real application, these would be stored in a database
  // For now, we'll just validate and return success
  
  const allowedSections = ['general', 'security', 'notifications', 'integrations', 'limits'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedSections.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Validate some critical settings
  if (updates.security?.sessionTimeout && (updates.security.sessionTimeout < 1 || updates.security.sessionTimeout > 24)) {
    return res.status(400).json({
      success: false,
      message: 'Session timeout must be between 1 and 24 hours'
    });
  }

  if (updates.limits?.maxClientsPerAdmin && updates.limits.maxClientsPerAdmin < 1) {
    return res.status(400).json({
      success: false,
      message: 'Max clients per admin must be at least 1'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Admin settings updated successfully',
    data: updates
  });
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Superadmin)
const getSystemLogs = asyncHandler(async (req, res) => {
  const { 
    level = 'all', 
    service = 'all',
    page = 1, 
    limit = 50,
    startDate,
    endDate 
  } = req.query;

  // Mock system logs
  const logs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'api',
      message: 'User login successful',
      details: { userId: 1, ip: '192.168.1.100' }
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      level: 'warning',
      service: 'database',
      message: 'Slow query detected',
      details: { query: 'SELECT * FROM clients', duration: '2.3s' }
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      level: 'error',
      service: 'payment',
      message: 'Payment processing failed',
      details: { clientId: 3, amount: 299, error: 'Card declined' }
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      level: 'info',
      service: 'system',
      message: 'Scheduled backup completed',
      details: { size: '1.2GB', duration: '45s' }
    }
  ];

  let filteredLogs = [...logs];

  // Apply filters
  if (level !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }

  if (service !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.service === service);
  }

  // Apply date filters
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= new Date(endDate)
    );
  }

  // Apply pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / parseInt(limit));

  res.status(200).json({
    success: true,
    data: paginatedLogs,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalLogs,
      hasNext: endIndex < totalLogs,
      hasPrev: startIndex > 0
    },
    filters: { level, service, startDate, endDate }
  });
});

// @desc    Get integration codes
// @route   GET /api/admin/integration-codes
// @access  Private (Superadmin)
const getIntegrationCodes = asyncHandler(async (req, res) => {
  const { status = 'all', search = '' } = req.query;

  let filteredCodes = [...integrationCodes];

  if (status !== 'all') {
    filteredCodes = filteredCodes.filter(code => code.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredCodes = filteredCodes.filter(code => 
      code.code.toLowerCase().includes(searchLower) ||
      code.clientName.toLowerCase().includes(searchLower)
    );
  }

  res.status(200).json({
    success: true,
    data: filteredCodes
  });
});

// @desc    Generate new integration code
// @route   POST /api/admin/integration-codes
// @access  Private (Superadmin)
const generateIntegrationCode = asyncHandler(async (req, res) => {
  const { clientId } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client ID is required'
    });
  }

  // Find client
  const { clients } = require('../data/mockData');
  const client = clients.find(c => c.id === parseInt(clientId));
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Generate unique 5-digit code
  let newCode;
  do {
    newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (integrationCodes.find(c => c.code === newCode));

  const newIntegrationCode = {
    id: Math.max(...integrationCodes.map(c => c.id)) + 1,
    code: newCode,
    clientId: parseInt(clientId),
    clientName: client.companyName,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };

  integrationCodes.push(newIntegrationCode);

  res.status(201).json({
    success: true,
    message: 'Integration code generated successfully',
    data: newIntegrationCode
  });
});

// @desc    Deactivate integration code
// @route   DELETE /api/admin/integration-codes/:code
// @access  Private (Superadmin)
const deactivateIntegrationCode = asyncHandler(async (req, res) => {
  const codeIndex = integrationCodes.findIndex(c => c.code === req.params.code);
  
  if (codeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Integration code not found'
    });
  }

  integrationCodes[codeIndex].status = 'inactive';

  res.status(200).json({
    success: true,
    message: 'Integration code deactivated successfully'
  });
});

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  getSystemLogs,
  getIntegrationCodes,
  generateIntegrationCode,
  deactivateIntegrationCode
};