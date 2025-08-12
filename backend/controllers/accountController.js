const { asyncHandler } = require('../middleware/errorHandler');
const { 
  accountService, 
  csmAssignmentService,
  auditService 
} = require('../services/database');

// @desc    Get all accounts with role-based filtering
// @route   GET /api/accounts
// @access  Private (CSM/Admin/Superadmin)
const getAccounts = asyncHandler(async (req, res) => {
  const {
    status,
    subscriptionPlan,
    page = 1,
    limit = 10,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const options = {
    status,
    subscriptionPlan,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    search,
    sortBy,
    sortOrder
  };

  let result;

  // Apply role-based filtering
  if (currentUserRole === 'csm') {
    // CSM can only see assigned accounts
    result = await accountService.getByCSM(currentUserId, options);
  } else if (['admin', 'superadmin'].includes(currentUserRole)) {
    // Admin and Superadmin can see all accounts
    result = await accountService.getAll(options);
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient privileges to view accounts.'
    });
  }

  // Log the action
  await auditService.log({
    userId: req.user.id,
    impersonatorId: req.user.impersonator_id,
    action: 'ACCOUNTS_LISTED',
    resourceType: 'ACCOUNT',
    resourceId: null,
    oldValues: null,
    newValues: { filters: options, userRole: currentUserRole },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private (CSM/Admin/Superadmin)
const getAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  const account = await accountService.findById(id);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: 'Account not found'
    });
  }

  // Check access permissions for CSM
  if (currentUserRole === 'csm') {
    const assignments = await csmAssignmentService.getByCSM(currentUserId);
    const hasAccess = assignments.some(assignment => assignment.account_id === id);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account not assigned to this CSM.'
      });
    }
  }

  // Get additional account details if admin/superadmin
  let accountData = { ...account };
  
  if (['admin', 'superadmin'].includes(currentUserRole)) {
    // Get CSM assignments for this account
    const { query } = require('../services/database');
    const assignmentsResult = await query(
      `SELECT ca.*, u.full_name as csm_name, u.email as csm_email
       FROM csm_assignments ca
       INNER JOIN users u ON ca.csm_id = u.id
       WHERE ca.account_id = $1
       ORDER BY ca.is_primary DESC, ca.assigned_at DESC`,
      [id]
    );
    
    accountData.assigned_csms = assignmentsResult.rows;
  }

  res.status(200).json({
    success: true,
    data: { account: accountData }
  });
});

// @desc    Create new account
// @route   POST /api/accounts
// @access  Private (Admin/Superadmin)
const createAccount = asyncHandler(async (req, res) => {
  const {
    name,
    companyName,
    email,
    phone,
    address,
    integrationCode,
    subscriptionPlan = 'basic',
    csmId
  } = req.body;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only admin and superadmin can create accounts
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can create accounts.'
    });
  }

  // Validate input
  if (!name || !companyName || !email || !integrationCode) {
    return res.status(400).json({
      success: false,
      message: 'Name, company name, email, and integration code are required'
    });
  }

  // Check if account with this email or integration code already exists
  const { query } = require('../services/database');
  const existingAccount = await query(
    'SELECT id FROM accounts WHERE email = $1 OR integration_code = $2',
    [email, integrationCode]
  );

  if (existingAccount.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Account with this email or integration code already exists'
    });
  }

  try {
    // Create account
    const newAccount = await accountService.create({
      name,
      companyName,
      email: email.toLowerCase(),
      phone,
      address,
      integrationCode,
      subscriptionPlan,
      createdBy: currentUserId
    });

    // Assign CSM if provided
    if (csmId) {
      await csmAssignmentService.assign({
        csmId,
        accountId: newAccount.id,
        assignedBy: currentUserId,
        isPrimary: true,
        notes: `Initial assignment during account creation`
      });
    }

    // Log account creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'ACCOUNT_CREATED',
      resourceType: 'ACCOUNT',
      resourceId: newAccount.id,
      oldValues: null,
      newValues: {
        name: newAccount.name,
        companyName: newAccount.company_name,
        email: newAccount.email,
        integrationCode: newAccount.integration_code,
        subscriptionPlan: newAccount.subscription_plan,
        assignedCSM: csmId
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        account: {
          id: newAccount.id,
          name: newAccount.name,
          company_name: newAccount.company_name,
          email: newAccount.email,
          phone: newAccount.phone,
          integration_code: newAccount.integration_code,
          subscription_plan: newAccount.subscription_plan,
          status: newAccount.status,
          created_at: newAccount.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account'
    });
  }
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private (Admin/Superadmin)
const updateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only admin and superadmin can update accounts
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can update accounts.'
    });
  }

  const account = await accountService.findById(id);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: 'Account not found'
    });
  }

  // Define allowed fields for update
  const allowedFields = [
    'name', 'company_name', 'email', 'phone', 'address', 'city', 'state', 
    'country', 'postal_code', 'website', 'business_license', 'tax_id',
    'subscription_plan', 'subscription_status', 'subscription_amount',
    'next_billing_date', 'ai_recommendation', 'whatsapp_integration',
    'tracking_active', 'marketing_active', 'status'
  ];

  // Filter update data to only allowed fields
  const filteredUpdateData = {};
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdateData[key] = updateData[key];
    }
  });

  if (Object.keys(filteredUpdateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  try {
    const { query } = require('../services/database');
    
    // Build update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(filteredUpdateData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(filteredUpdateData[key]);
      paramCount++;
    });

    values.push(id);
    
    const result = await query(
      `UPDATE accounts SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    const updatedAccount = result.rows[0];

    // Log account update
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'ACCOUNT_UPDATED',
      resourceType: 'ACCOUNT',
      resourceId: id,
      oldValues: {
        name: account.name,
        company_name: account.company_name,
        email: account.email,
        subscription_plan: account.subscription_plan,
        status: account.status
      },
      newValues: filteredUpdateData,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        account: updatedAccount
      }
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating account'
    });
  }
});

// @desc    Delete account (soft delete)
// @route   DELETE /api/accounts/:id
// @access  Private (Superadmin only)
const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only superadmin can delete accounts
  if (currentUserRole !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only superadmin can delete accounts.'
    });
  }

  const account = await accountService.findById(id);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: 'Account not found'
    });
  }

  try {
    const { query } = require('../services/database');
    
    // Soft delete by updating status
    await query(
      'UPDATE accounts SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );

    // Log account deletion
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'ACCOUNT_DELETED',
      resourceType: 'ACCOUNT',
      resourceId: id,
      oldValues: {
        name: account.name,
        company_name: account.company_name,
        email: account.email,
        status: account.status
      },
      newValues: { status: 'deleted' },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// @desc    Assign CSM to account
// @route   POST /api/accounts/:id/assign-csm
// @access  Private (Admin/Superadmin)
const assignCSMToAccount = asyncHandler(async (req, res) => {
  const { id: accountId } = req.params;
  const { csmId, isPrimary = false, notes } = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only admin and superadmin can assign CSMs
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can assign CSMs.'
    });
  }

  if (!csmId) {
    return res.status(400).json({
      success: false,
      message: 'CSM ID is required'
    });
  }

  // Verify account exists
  const account = await accountService.findById(accountId);
  if (!account) {
    return res.status(404).json({
      success: false,
      message: 'Account not found'
    });
  }

  // Verify CSM exists and has correct role
  const { userService } = require('../services/database');
  const csm = await userService.findById(csmId);
  if (!csm) {
    return res.status(404).json({
      success: false,
      message: 'CSM not found'
    });
  }

  if (csm.role !== 'csm') {
    return res.status(400).json({
      success: false,
      message: 'User is not a CSM'
    });
  }

  try {
    const assignment = await csmAssignmentService.assign({
      csmId,
      accountId,
      assignedBy: currentUserId,
      isPrimary,
      notes
    });

    // Log the assignment
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'CSM_ASSIGNED_TO_ACCOUNT',
      resourceType: 'CSM_ASSIGNMENT',
      resourceId: accountId,
      oldValues: null,
      newValues: {
        csmId,
        accountId,
        isPrimary,
        notes,
        csmName: csm.full_name,
        accountName: account.name
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'CSM assigned to account successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Error assigning CSM to account:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning CSM to account'
    });
  }
});

// @desc    Remove CSM from account
// @route   DELETE /api/accounts/:id/csm/:csmId
// @access  Private (Admin/Superadmin)
const removeCSMFromAccount = asyncHandler(async (req, res) => {
  const { id: accountId, csmId } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only admin and superadmin can remove CSM assignments
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can remove CSM assignments.'
    });
  }

  try {
    const removedAssignment = await csmAssignmentService.remove(csmId, accountId);

    if (!removedAssignment) {
      return res.status(404).json({
        success: false,
        message: 'CSM assignment not found'
      });
    }

    // Log the removal
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'CSM_REMOVED_FROM_ACCOUNT',
      resourceType: 'CSM_ASSIGNMENT',
      resourceId: accountId,
      oldValues: removedAssignment,
      newValues: null,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'CSM removed from account successfully'
    });
  } catch (error) {
    console.error('Error removing CSM from account:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing CSM from account'
    });
  }
});

// @desc    Get account statistics
// @route   GET /api/accounts/stats
// @access  Private (Admin/Superadmin)
const getAccountStats = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view account statistics.'
    });
  }

  try {
    const { query } = require('../services/database');
    
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_accounts,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_accounts,
        COUNT(CASE WHEN subscription_plan = 'basic' THEN 1 END) as basic_plans,
        COUNT(CASE WHEN subscription_plan = 'premium' THEN 1 END) as premium_plans,
        COUNT(CASE WHEN subscription_plan = 'enterprise' THEN 1 END) as enterprise_plans,
        SUM(monthly_revenue) as total_monthly_revenue,
        AVG(monthly_revenue) as avg_monthly_revenue
      FROM accounts 
      WHERE status != 'deleted'
    `);

    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: parseInt(stats.total_accounts),
          active: parseInt(stats.active_accounts),
          inactive: parseInt(stats.inactive_accounts),
          byPlan: {
            basic: parseInt(stats.basic_plans),
            premium: parseInt(stats.premium_plans),
            enterprise: parseInt(stats.enterprise_plans)
          },
          revenue: {
            total: parseFloat(stats.total_monthly_revenue) || 0,
            average: parseFloat(stats.avg_monthly_revenue) || 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting account stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving account statistics'
    });
  }
});

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  assignCSMToAccount,
  removeCSMFromAccount,
  getAccountStats
};
