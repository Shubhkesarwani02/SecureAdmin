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

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private (Superadmin)
const getClientStats = asyncHandler(async (req, res) => {
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    pending: clients.filter(c => c.status === 'pending').length,
    byPlan: {
      basic: clients.filter(c => c.subscription.plan === 'basic').length,
      professional: clients.filter(c => c.subscription.plan === 'professional').length,
      enterprise: clients.filter(c => c.subscription.plan === 'enterprise').length
    },
    integrations: {
      aiRecommendation: clients.filter(c => c.integrations.aiRecommendation).length,
      whatsapp: clients.filter(c => c.integrations.whatsapp).length,
      tracking: clients.filter(c => c.integrations.tracking).length,
      marketing: clients.filter(c => c.integrations.marketing).length
    },
    revenue: {
      total: clients.reduce((sum, client) => sum + client.stats.monthlyRevenue, 0),
      recurring: clients.filter(c => c.status === 'active').reduce((sum, client) => sum + client.subscription.amount, 0)
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
  getClientStats
};