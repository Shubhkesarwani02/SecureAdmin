const { clients, integrationCodes } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');
const { auditService } = require('../services/database');
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
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredClients.length / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      clients: paginatedClients,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalClients: filteredClients.length,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private (Superadmin)
const getClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const client = clients.find(c => c.id === parseInt(id));
  
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { client }
  });
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
      id: Math.max(...clients.map(c => c.id), 0) + 1,
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
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: getPlanRevenue(plan)
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
      integrations: {
        aiRecommendation: plan === 'enterprise',
        whatsapp: false,
        tracking: true,
        marketing: false
      },
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString(),
      lastLogin: null,
      healthScore: 85,
      notes: []
    };

    // Add to clients array
    clients.push(newClient);

    // Log the creation
    if (auditService && auditService.log) {
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
    }

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

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Superadmin)
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const clientIndex = clients.findIndex(c => c.id === parseInt(id));
  
  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  try {
    const oldClient = { ...clients[clientIndex] };
    
    // Update client data
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        if (key === 'subscription' || key === 'stats' || key === 'settings') {
          clients[clientIndex][key] = { ...clients[clientIndex][key], ...updates[key] };
        } else {
          clients[clientIndex][key] = updates[key];
        }
      }
    });

    clients[clientIndex].lastActivity = new Date().toISOString();

    // Log the update
    if (auditService && auditService.log) {
      await auditService.log({
        userId: currentUserId,
        impersonatorId: req.user.impersonator_id,
        action: 'CLIENT_UPDATED',
        resourceType: 'CLIENT',
        resourceId: parseInt(id),
        oldValues: oldClient,
        newValues: clients[clientIndex],
        ipAddress,
        userAgent
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: { client: clients[clientIndex] }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client'
    });
  }
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Superadmin)
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const clientIndex = clients.findIndex(c => c.id === parseInt(id));
  
  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  try {
    const deletedClient = clients[clientIndex];
    
    // Remove client from array
    clients.splice(clientIndex, 1);

    // Log the deletion
    if (auditService && auditService.log) {
      await auditService.log({
        userId: currentUserId,
        impersonatorId: req.user.impersonator_id,
        action: 'CLIENT_DELETED',
        resourceType: 'CLIENT',
        resourceId: parseInt(id),
        oldValues: deletedClient,
        newValues: null,
        ipAddress,
        userAgent
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client'
    });
  }
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
      'ID', 'Company Name', 'Email', 'Contact Person', 'Phone', 'Status', 'Plan', 
      'Monthly Revenue', 'Total Vehicles', 'Active Users', 'Created At', 'Last Activity'
    ];
    
    const csvData = [
      headers.join(','),
      ...filteredClients.map(client => [
        client.id,
        `"${client.companyName}"`,
        client.email,
        `"${client.contactPerson || 'N/A'}"`,
        client.phone || 'N/A',
        client.status,
        client.subscription.plan,
        client.stats.monthlyRevenue || 0,
        client.stats.totalVehicles || 0,
        client.stats.activeUsers || 0,
        client.createdAt,
        client.lastActivity || 'N/A'
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

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private (Superadmin)
const getClientStats = asyncHandler(async (req, res) => {
  const stats = {
    total: clients.length,
    byStatus: {
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      suspended: clients.filter(c => c.status === 'suspended').length,
      pending: clients.filter(c => c.status === 'pending').length
    },
    byPlan: {
      basic: clients.filter(c => c.subscription?.plan === 'basic').length,
      standard: clients.filter(c => c.subscription?.plan === 'standard').length,
      professional: clients.filter(c => c.subscription?.plan === 'professional').length,
      enterprise: clients.filter(c => c.subscription?.plan === 'enterprise').length
    },
    revenue: {
      total: clients.reduce((sum, client) => sum + (client.stats?.monthlyRevenue || 0), 0),
      recurring: clients.filter(c => c.status === 'active').reduce((sum, client) => sum + (client.stats?.monthlyRevenue || 0), 0)
    },
    growth: {
      newThisMonth: clients.filter(c => {
        const createdDate = new Date(c.createdAt);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
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

module.exports = {
  getClients,
  getClient,
  addClient,
  updateClient,
  deleteClient,
  exportClientData,
  getClientStats
};
