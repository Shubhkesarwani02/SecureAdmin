const { asyncHandler } = require('../middleware/errorHandler');
const { userService, auditService } = require('../services/database');

// @desc    Get all clients with role-based filtering
// @route   GET /api/clients
// @access  Private (Superadmin/Admin/CSM)
const getClients = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const { page = 1, limit = 10, search, status } = req.query;

  try {
    let clients = [];
    let totalCount = 0;

    if (currentUserRole === 'superadmin') {
      // Superadmin can see all clients
      const query = `
        SELECT 
          c.*,
          COUNT(*) OVER() as total_count
        FROM clients c 
        WHERE ($1::text IS NULL OR c.company_name ILIKE $1 OR c.email ILIKE $1)
          AND ($2::text IS NULL OR c.status = $2)
        ORDER BY c.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      const searchParam = search ? `%${search}%` : null;
      const offset = (page - 1) * limit;
      
      const result = await userService.executeQuery(query, [searchParam, status, limit, offset]);
      clients = result.rows || [];
      totalCount = clients.length > 0 ? parseInt(clients[0].total_count) : 0;
      
    } else if (currentUserRole === 'admin') {
      // Admin can see all assigned clients (for now, all clients - can be restricted based on admin assignments)
      const query = `
        SELECT 
          c.*,
          COUNT(*) OVER() as total_count
        FROM clients c 
        WHERE ($1::text IS NULL OR c.company_name ILIKE $1 OR c.email ILIKE $1)
          AND ($2::text IS NULL OR c.status = $2)
        ORDER BY c.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      const searchParam = search ? `%${search}%` : null;
      const offset = (page - 1) * limit;
      
      const result = await userService.executeQuery(query, [searchParam, status, limit, offset]);
      clients = result.rows || [];
      totalCount = clients.length > 0 ? parseInt(clients[0].total_count) : 0;
      
    } else if (currentUserRole === 'csm') {
      // CSM can only see their assigned clients
      const query = `
        SELECT 
          c.*,
          COUNT(*) OVER() as total_count
        FROM clients c 
        INNER JOIN csm_assignments ca ON c.id = ca.account_id::bigint
        WHERE ca.csm_id = $1
          AND ($2::text IS NULL OR c.company_name ILIKE $2 OR c.email ILIKE $2)
          AND ($3::text IS NULL OR c.status = $3)
        ORDER BY c.created_at DESC
        LIMIT $4 OFFSET $5
      `;
      const searchParam = search ? `%${search}%` : null;
      const offset = (page - 1) * limit;
      
      const result = await userService.executeQuery(query, [currentUserId, searchParam, status, limit, offset]);
      clients = result.rows || [];
      totalCount = clients.length > 0 ? parseInt(clients[0].total_count) : 0;
    }

    // Remove sensitive information based on role
    const sanitizedClients = clients.map(client => {
      const sanitized = { ...client };
      
      // Remove subscription details for non-superadmin users
      if (currentUserRole !== 'superadmin') {
        delete sanitized.subscription_amount;
        delete sanitized.next_billing_date;
      }
      
      return sanitized;
    });

    res.status(200).json({
      success: true,
      data: {
        clients: sanitizedClients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients'
    });
  }
});

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private (Superadmin/Admin/CSM)
const getClientStats = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let stats = {};

    if (currentUserRole === 'superadmin') {
      // Superadmin sees all client stats
      const query = `
        SELECT 
          COUNT(*) as total_clients,
          COUNT(*) FILTER (WHERE status = 'active') as active_clients,
          COUNT(*) FILTER (WHERE status = 'inactive') as inactive_clients,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_clients,
          COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_clients,
          SUM(monthly_revenue) as total_revenue
        FROM clients
      `;
      const result = await userService.executeQuery(query);
      stats = result.rows[0] || {};
      
    } else if (currentUserRole === 'admin') {
      // Admin sees stats for all assigned clients
      const query = `
        SELECT 
          COUNT(*) as total_clients,
          COUNT(*) FILTER (WHERE status = 'active') as active_clients,
          COUNT(*) FILTER (WHERE status = 'inactive') as inactive_clients,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_clients,
          COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_clients
        FROM clients
      `;
      const result = await userService.executeQuery(query);
      stats = result.rows[0] || {};
      // Don't include revenue for admin
      
    } else if (currentUserRole === 'csm') {
      // CSM sees stats for their assigned clients only
      const query = `
        SELECT 
          COUNT(*) as total_clients,
          COUNT(*) FILTER (WHERE c.status = 'active') as active_clients,
          COUNT(*) FILTER (WHERE c.status = 'inactive') as inactive_clients,
          COUNT(*) FILTER (WHERE c.status = 'pending') as pending_clients
        FROM clients c 
        INNER JOIN csm_assignments ca ON c.id = ca.account_id::bigint
        WHERE ca.csm_id = $1
      `;
      const result = await userService.executeQuery(query, [currentUserId]);
      stats = result.rows[0] || {};
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client statistics'
    });
  }
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Superadmin only)
const createClient = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  // Only superadmin can create clients
  if (currentUserRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only superadmin can create new clients.'
    });
  }

  const {
    company_name,
    email,
    phone,
    address,
    subscription_plan = 'basic',
    subscription_amount = 99.00
  } = req.body;

  // Validate required fields
  if (!company_name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Company name and email are required'
    });
  }

  try {
    // Generate unique integration code
    const generateIntegrationCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    let integrationCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      integrationCode = generateIntegrationCode();
      const checkQuery = 'SELECT id FROM clients WHERE integration_code = $1';
      const checkResult = await userService.executeQuery(checkQuery, [integrationCode]);
      isUnique = checkResult.rows.length === 0;
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique integration code');
    }

    // Insert new client
    const insertQuery = `
      INSERT INTO clients (
        company_name, email, phone, address, subscription_plan, 
        subscription_amount, integration_code, status, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'trial')
      RETURNING *
    `;

    const result = await userService.executeQuery(insertQuery, [
      company_name, email, phone, address, subscription_plan, 
      subscription_amount, integrationCode
    ]);

    const newClient = result.rows[0];

    // Log the action
    await auditService.logAction({
      userId: currentUserId,
      action: 'client.create',
      resource: 'client',
      resourceId: newClient.id,
      details: { company_name, email, integration_code: integrationCode },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Client created successfully'
    });

  } catch (error) {
    console.error('Error creating client:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'A client with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating client'
    });
  }
});

// @desc    Export clients data
// @route   GET /api/clients/export
// @access  Private (Superadmin/Admin/CSM)
const exportClients = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const { format = 'csv' } = req.query;

  try {
    let clients = [];

    if (currentUserRole === 'superadmin') {
      const query = 'SELECT * FROM clients ORDER BY created_at DESC';
      const result = await userService.executeQuery(query);
      clients = result.rows || [];
    } else if (currentUserRole === 'admin') {
      const query = 'SELECT * FROM clients ORDER BY created_at DESC';
      const result = await userService.executeQuery(query);
      clients = result.rows || [];
      
      // Remove sensitive fields for admin
      clients = clients.map(client => {
        const { subscription_amount, ...safeClient } = client;
        return safeClient;
      });
    } else if (currentUserRole === 'csm') {
      const query = `
        SELECT c.* FROM clients c 
        INNER JOIN csm_assignments ca ON c.id = ca.account_id::bigint
        WHERE ca.csm_id = $1
        ORDER BY c.created_at DESC
      `;
      const result = await userService.executeQuery(query, [currentUserId]);
      clients = result.rows || [];
      
      // Remove sensitive fields for CSM
      clients = clients.map(client => {
        const { subscription_amount, subscription_status, ...safeClient } = client;
        return safeClient;
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const fields = Object.keys(clients[0] || {});
      const csv = [
        fields.join(','),
        ...clients.map(client => 
          fields.map(field => `"${client[field] || ''}"`).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=clients-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: clients
      });
    }

    // Log the export action
    await auditService.logAction({
      userId: currentUserId,
      action: 'client.export',
      resource: 'client',
      details: { format, count: clients.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

  } catch (error) {
    console.error('Error exporting clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting clients'
    });
  }
});

module.exports = {
  getClients,
  getClientStats,
  createClient,
  exportClients
};
