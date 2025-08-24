const { clients, integrationCodes } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get all clients with filtering
// @route   GET /api/clients
// @access  Private (Superadmin)
const getClients = asyncHandler(async (req, res) => {
  const { 
    status, 
    search, 
    plan,
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let filteredClients = [...clients];

  // Apply filters
  if (status && status !== 'all') {
    filteredClients = filteredClients.filter(client => client.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredClients = filteredClients.filter(client => 
      client.companyName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.integrationCode.toLowerCase().includes(searchLower)
    );
  }

  if (plan && plan !== 'all') {
    filteredClients = filteredClients.filter(client => client.subscription.plan === plan);
  }

  // Apply sorting
  filteredClients.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'monthlyRevenue') {
      aVal = a.stats.monthlyRevenue;
      bVal = b.stats.monthlyRevenue;
    }
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'desc') {
      return bVal > aVal ? 1 : -1;
    } else {
      return aVal > bVal ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Calculate pagination info
  const totalClients = filteredClients.length;
  const totalPages = Math.ceil(totalClients / parseInt(limit));

  res.status(200).json({
    success: true,
    data: paginatedClients,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalClients,
      hasNext: endIndex < totalClients,
      hasPrev: startIndex > 0
    },
    filters: {
      status: status || 'all',
      search: search || '',
      plan: plan || 'all'
    }
  });
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private (Superadmin)
const getClient = asyncHandler(async (req, res) => {
  const client = clients.find(c => c.id === parseInt(req.params.id));
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Add additional detailed information
  const clientWithDetails = {
    ...client,
    integrationDetails: {
      code: client.integrationCode,
      endpoints: [
        { name: 'Bookings API', status: 'active', lastUsed: moment().subtract(2, 'hours').toISOString() },
        { name: 'Vehicle Management', status: 'active', lastUsed: moment().subtract(1, 'day').toISOString() },
        { name: 'Customer API', status: 'active', lastUsed: moment().subtract(3, 'hours').toISOString() }
      ],
      webhooks: [
        { event: 'booking.created', status: 'active', deliveries: 1247 },
        { event: 'booking.cancelled', status: 'active', deliveries: 89 },
        { event: 'payment.processed', status: 'active', deliveries: 567 }
      ]
    },
    activityLog: [
      {
        id: 1,
        action: 'login',
        description: 'Admin user logged in',
        timestamp: moment().subtract(2, 'hours').toISOString(),
        ip: '192.168.1.100'
      },
      {
        id: 2,
        action: 'booking_created',
        description: 'New booking #1247 created',
        timestamp: moment().subtract(4, 'hours').toISOString(),
        ip: '192.168.1.100'
      },
      {
        id: 3,
        action: 'payment_processed',
        description: 'Monthly subscription payment processed',
        timestamp: moment().subtract(1, 'day').toISOString(),
        ip: 'system'
      }
    ]
  };

  res.status(200).json({
    success: true,
    data: clientWithDetails
  });
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Superadmin)
const createClient = asyncHandler(async (req, res) => {
  const { 
    companyName, 
    email, 
    phone, 
    address, 
    subscriptionPlan = 'basic' 
  } = req.body;

  // Validate required fields
  if (!companyName || !email) {
    return res.status(400).json({
      success: false,
      message: 'Company name and email are required'
    });
  }

  // Check if email already exists
  const existingClient = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (existingClient) {
    return res.status(400).json({
      success: false,
      message: 'Client with this email already exists'
    });
  }

  // Generate integration code
  const integrationCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  // Create new client
  const newClient = {
    id: Math.max(...clients.map(c => c.id)) + 1,
    companyName,
    email,
    phone: phone || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    address: address || null,
    integrationCode,
    subscription: {
      plan: subscriptionPlan,
      status: 'trial',
      nextBilling: moment().add(1, 'month').toISOString(),
      amount: subscriptionPlan === 'enterprise' ? 299 : subscriptionPlan === 'professional' ? 199 : 99
    },
    integrations: {
      aiRecommendation: subscriptionPlan === 'enterprise',
      whatsapp: false,
      tracking: false,
      marketing: false
    },
    stats: {
      totalBookings: 0,
      activeVehicles: 0,
      monthlyRevenue: 0
    }
  };

  // Add to clients array
  clients.push(newClient);

  // Add integration code
  integrationCodes.push({
    id: Math.max(...integrationCodes.map(c => c.id)) + 1,
    code: integrationCode,
    clientId: newClient.id,
    clientName: companyName,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  });

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    data: newClient
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Superadmin)
const updateClient = asyncHandler(async (req, res) => {
  const clientIndex = clients.findIndex(c => c.id === parseInt(req.params.id));
  
  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  const allowedUpdates = ['companyName', 'email', 'phone', 'address', 'status'];
  const updates = {};

  // Filter only allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update client
  clients[clientIndex] = {
    ...clients[clientIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    message: 'Client updated successfully',
    data: clients[clientIndex]
  });
});

// @desc    Delete/Disable client
// @route   DELETE /api/clients/:id
// @access  Private (Superadmin)
const deleteClient = asyncHandler(async (req, res) => {
  const clientIndex = clients.findIndex(c => c.id === parseInt(req.params.id));
  
  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Instead of deleting, set status to inactive
  clients[clientIndex].status = 'inactive';
  clients[clientIndex].updatedAt = new Date().toISOString();

  // Also deactivate integration code
  const codeIndex = integrationCodes.findIndex(c => c.clientId === clients[clientIndex].id);
  if (codeIndex !== -1) {
    integrationCodes[codeIndex].status = 'inactive';
  }

  res.status(200).json({
    success: true,
    message: 'Client disabled successfully'
  });
});

// @desc    Export client data
// @route   GET /api/clients/export
// @access  Private (Superadmin)
const exportClientData = asyncHandler(async (req, res) => {
  const { format = 'csv', status, plan } = req.query;

  let filteredClients = [...clients];

  // Apply filters
  if (status && status !== 'all') {
    filteredClients = filteredClients.filter(client => client.status === status);
  }

  if (plan && plan !== 'all') {
    filteredClients = filteredClients.filter(client => client.subscription.plan === plan);
  }

  if (format === 'csv') {
    // Generate CSV data
    const headers = [
      'ID', 'Company Name', 'Email', 'Status', 'Plan', 'Monthly Revenue', 
      'Total Vehicles', 'Active Users', 'Created At', 'Last Activity'
    ];
    
    const csvData = [
      headers.join(','),
      ...filteredClients.map(client => [
        client.id,
        `"${client.companyName}"`,
        client.email,
        client.status,
        client.subscription.plan,
        client.stats.monthlyRevenue,
        client.stats.totalVehicles,
        client.stats.activeUsers,
        client.createdAt,
        client.lastActivity
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="clients-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } else {
    // Return JSON format
    res.status(200).json({
      success: true,
      data: {
        clients: filteredClients,
        exportedAt: new Date().toISOString(),
        totalRecords: filteredClients.length,
        filters: { status, plan }
      }
    });
  }
});

// @desc    Add new client
// @route   POST /api/clients
// @access  Private (Superadmin)
const addClient = asyncHandler(async (req, res) => {
  const {
    companyName,
    email,
    contactPerson,
    phone,
    address,
    plan = 'standard',
    customSettings = {}
  } = req.body;

  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate required fields
  if (!companyName || !email || !contactPerson) {
    return res.status(400).json({
      success: false,
      message: 'Company name, email, and contact person are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Check if client with email already exists
  const existingClient = clients.find(client => client.email.toLowerCase() === email.toLowerCase());
  if (existingClient) {
    return res.status(400).json({
      success: false,
      message: 'A client with this email already exists'
    });
  }

  try {
    // Generate integration code
    const integrationCode = `CLIENT_${companyName.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`.substring(0, 32);

    // Create new client
    const newClient = {
      id: clients.length + 1,
      companyName,
      email: email.toLowerCase(),
      contactPerson,
      phone: phone || null,
      address: address || null,
      status: 'active',
      integrationCode,
      subscription: {
        plan,
        status: 'active',
        billingCycle: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      stats: {
        totalVehicles: 0,
        activeUsers: 0,
        monthlyRevenue: getPlanRevenue(plan),
        totalRevenue: 0,
        lastActivityDate: new Date().toISOString().split('T')[0]
      },
      settings: {
        emailNotifications: true,
        apiAccess: true,
        customBranding: plan === 'enterprise',
        maxUsers: getMaxUsers(plan),
        ...customSettings
      },
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString(),
      healthScore: 85,
      notes: []
    };

    // Add to clients array
    clients.push(newClient);

    // Log the creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'CLIENT_CREATED',
      resourceType: 'CLIENT',
      resourceId: newClient.id,
      oldValues: null,
      newValues: {
        companyName: newClient.companyName,
        email: newClient.email,
        plan: newClient.subscription.plan,
        status: newClient.status
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { client: newClient }
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating client'
    });
  }
});

// Helper functions
function getPlanRevenue(plan) {
  const revenues = {
    basic: 299,
    standard: 599,
    professional: 1199,
    enterprise: 2499
  };
  return revenues[plan] || 599;
}

function getMaxUsers(plan) {
  const limits = {
    basic: 5,
    standard: 15,
    professional: 50,
    enterprise: -1 // unlimited
  };
  return limits[plan] || 15;
}
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    pending: clients.filter(c => c.status === 'pending').length,
// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private (Superadmin)
const getClientStats = asyncHandler(async (req, res) => {
  const stats = {
    total: clients.length,
    byStatus: {
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      suspended: clients.filter(c => c.status === 'suspended').length
    },
    byPlan: {
      basic: clients.filter(c => c.subscription.plan === 'basic').length,
      standard: clients.filter(c => c.subscription.plan === 'standard').length,
      professional: clients.filter(c => c.subscription.plan === 'professional').length,
      enterprise: clients.filter(c => c.subscription.plan === 'enterprise').length
    },
    revenue: {
      total: clients.reduce((sum, client) => sum + (client.stats.monthlyRevenue || 0), 0),
      recurring: clients.filter(c => c.status === 'active').reduce((sum, client) => sum + (client.stats.monthlyRevenue || 0), 0)
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  exportClientData,
  addClient
};