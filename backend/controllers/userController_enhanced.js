const { asyncHandler } = require('../middleware/errorHandler');
const { 
  userService, 
  accountService, 
  csmAssignmentService,
  auditService 
} = require('../services/database');

// @desc    Get all users with role-based filtering
// @route   GET /api/users
// @access  Private (Admin/Superadmin)
const getUsers = asyncHandler(async (req, res) => {
  const {
    role,
    status,
    page = 1,
    limit = 10,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const options = {
    role,
    status,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100), // Cap at 100
    search,
    sortBy,
    sortOrder
  };

  let result;

  console.log('DEBUG getUsers - currentUserRole:', currentUserRole, 'currentUserId:', currentUserId);

  // Apply role-based filtering
  if (currentUserRole === 'admin') {
    // Admin can see CSMs and regular users, but not other admins or superadmins
    if (!role) {
      options.role = ['csm', 'user'];
    } else if (!['csm', 'user'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin can only view CSM and regular users.'
      });
    }
    result = await userService.getAll(options);
  } else if (currentUserRole === 'superadmin') {
    // Superadmin can see all users
    result = await userService.getAll(options);
  } else if (currentUserRole === 'csm') {
    console.log('DEBUG getUsers - CSM role detected');
    // CSM can see all assigned users in their accounts
    const { csmAssignmentService, userAccountService } = require('../services/database');
    
    // Get all accounts assigned to this CSM
    const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
    const accountIds = csmAssignments.map(assignment => assignment.account_id);
    
    console.log('DEBUG getUsers - CSM assignments:', csmAssignments);
    console.log('DEBUG getUsers - Account IDs:', accountIds);
    
    if (accountIds.length === 0) {
      // CSM with no accounts assigned, return empty result but don't block access
      result = { users: [], totalCount: 0 };
    } else {
      // Get all users in the assigned accounts
      const query = `
        SELECT DISTINCT u.*, 
               COUNT(*) OVER() as total_count
        FROM users u
        INNER JOIN user_accounts ua ON u.id = ua.user_id
        WHERE ua.account_id = ANY($1::bigint[])
          AND u.role = 'user'
          AND ($2::text IS NULL OR u.full_name ILIKE $2 OR u.email ILIKE $2)
          AND ($3::text IS NULL OR u.status = $3)
        ORDER BY ${sortBy || 'created_at'} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $4 OFFSET $5
      `;
      
      const searchParam = search ? `%${search}%` : null;
      const offset = (page - 1) * limit;
      
      const queryResult = await userService.executeQuery(query, [
        accountIds,
        searchParam,
        status,
        limit,
        offset
      ]);
      
      const users = queryResult.rows || [];
      const totalCount = users.length > 0 ? parseInt(users[0].total_count) : 0;
      
      result = {
        users: users.map(user => {
          const { total_count, ...userData } = user;
          return userData;
        }),
        totalCount
      };
    }
  } else {
    // Other roles have no access to user management
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions to view users.'
    });
  }

  // Log the action
  await auditService.log({
    userId: req.user.id,
    impersonatorId: req.user.impersonator_id,
    action: 'USERS_LISTED',
    resourceType: 'USER',
    resourceId: null,
    oldValues: null,
    newValues: { filters: options, userRole: currentUserRole },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    data: result.users || result,
    pagination: result.total ? {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    } : undefined
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  const user = await userService.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check access permissions
  if (currentUserId !== id) {
    if (currentUserRole === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Users can only view their own profile.'
      });
    }
    
    if (currentUserRole === 'csm') {
      // CSM can only view users in their assigned accounts
      if (user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. CSM can only view regular users in assigned accounts.'
        });
      }

      // Check if the user belongs to any account assigned to this CSM
      const { userAccountService, csmAssignmentService } = require('../services/database');
      
      const userAccounts = await userAccountService.getByUser(id);
      const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
      
      const hasCommonAccount = userAccounts.some(userAccount => 
        csmAssignments.some(assignment => assignment.account_id === userAccount.account_id)
      );
      
      if (!hasCommonAccount) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This user is not in any account assigned to you.'
        });
      }
    }

    if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin cannot view other admin/superadmin users.'
      });
    }
  }

  // Remove sensitive information based on role
  const userResponse = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    role: user.role,
    department: user.department,
    status: user.status,
    avatar: user.avatar,
    bio: user.bio,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_login
  };

  // Only include sensitive fields for superadmin or self
  if (currentUserRole === 'superadmin' || currentUserId === id) {
    userResponse.permissions = user.permissions;
    userResponse.preferences = user.preferences;
    userResponse.is_impersonation_active = user.is_impersonation_active;
    userResponse.current_impersonator_id = user.current_impersonator_id;
  }

  res.status(200).json({
    success: true,
    data: { user: userResponse }
  });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin/Superadmin)
const createUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    fullName,
    phone,
    role,
    department,
    accountId
  } = req.body;

  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!email || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, full name, and role are required'
    });
  }

  // Role-based creation restrictions
  if (currentUserRole === 'admin') {
    if (!['csm', 'user'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin can only create CSM and regular user accounts'
      });
    }
  }

  // Check if user already exists
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  try {
    // Create user
    const newUser = await userService.create({
      email: email.toLowerCase(),
      password,
      fullName,
      phone,
      role,
      department,
      createdBy: currentUserId
    });

    // If role is 'user' and accountId is provided, assign to account
    if (role === 'user' && accountId) {
      const { userAccountService } = require('../services/database');
      await userAccountService.assign({
        userId: newUser.id,
        accountId,
        roleInAccount: 'member',
        assignedBy: currentUserId
      });
    }

    // Log user creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: newUser.id,
      oldValues: null,
      newValues: {
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        department: newUser.department
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
          department: newUser.department,
          status: newUser.status,
          created_at: newUser.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const user = await userService.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check permissions
  if (currentUserId !== id) {
    if (currentUserRole === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Users can only update their own profile'
      });
    }

    if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot update other admin/superadmin users'
      });
    }

    if (currentUserRole === 'csm') {
      // CSM can update users in their assigned accounts only
      if (user.role !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'CSM can only update regular users in assigned accounts'
        });
      }

      // Check if the user belongs to any account assigned to this CSM
      const { userAccountService, csmAssignmentService } = require('../services/database');
      
      const userAccounts = await userAccountService.getByUser(id);
      const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
      
      const hasCommonAccount = userAccounts.some(userAccount => 
        csmAssignments.some(assignment => assignment.account_id === userAccount.account_id)
      );
      
      if (!hasCommonAccount) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This user is not in any account assigned to you.'
        });
      }
    }
  }

  // Restrict what fields can be updated based on role
  const allowedFields = ['full_name', 'phone', 'bio', 'avatar', 'preferences'];
  
  if (currentUserRole === 'superadmin') {
    allowedFields.push('role', 'department', 'status', 'permissions');
  } else if (currentUserRole === 'admin' && currentUserId !== id) {
    allowedFields.push('role', 'department', 'status');
    // Admin can't change role to admin or superadmin
    if (updateData.role && ['admin', 'superadmin'].includes(updateData.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot assign admin or superadmin roles'
      });
    }
  } else if (currentUserRole === 'csm' && currentUserId !== id) {
    // CSM can update basic user fields for assigned accounts
    allowedFields.push('department', 'status');
    // CSM cannot change user roles
    if (updateData.role) {
      return res.status(403).json({
        success: false,
        message: 'CSM cannot change user roles'
      });
    }
  }

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
    const oldValues = { ...user };
    const updatedUser = await userService.update(id, filteredUpdateData);

    // Log user update
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: id,
      oldValues: {
        full_name: oldValues.full_name,
        phone: oldValues.phone,
        role: oldValues.role,
        department: oldValues.department,
        status: oldValues.status
      },
      newValues: filteredUpdateData,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          role: updatedUser.role,
          department: updatedUser.department,
          status: updatedUser.status,
          updated_at: updatedUser.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin/Superadmin)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  if (currentUserId === id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  const user = await userService.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Role-based deletion restrictions
  if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin cannot delete other admin/superadmin users'
    });
  }

  try {
    // Soft delete by updating status
    await userService.update(id, { status: 'deleted' });

    // Log user deletion
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: id,
      oldValues: {
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      },
      newValues: { status: 'deleted' },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @desc    Assign CSM to accounts
// @route   POST /api/users/:id/assign-accounts
// @access  Private (Admin/Superadmin)
const assignCSMToAccounts = asyncHandler(async (req, res) => {
  const { id: csmId } = req.params;
  const { accountIds, isPrimary = false } = req.body;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Account IDs array is required'
    });
  }

  // Verify CSM exists and has correct role
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
    const assignments = [];
    
    for (const accountId of accountIds) {
      const assignment = await csmAssignmentService.assign({
        csmId,
        accountId,
        assignedBy: currentUserId,
        isPrimary,
        notes: `Assigned via API by ${req.user.fullName}`
      });
      assignments.push(assignment);
    }

    // Log the assignment
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'CSM_ACCOUNTS_ASSIGNED',
      resourceType: 'CSM_ASSIGNMENT',
      resourceId: csmId,
      oldValues: null,
      newValues: { csmId, accountIds, isPrimary },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'CSM assigned to accounts successfully',
      data: { assignments }
    });
  } catch (error) {
    console.error('Error assigning CSM to accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning CSM to accounts'
    });
  }
});

// @desc    Get CSM assignments
// @route   GET /api/users/:id/assignments
// @access  Private (Admin/Superadmin or self if CSM)
const getCSMAssignments = asyncHandler(async (req, res) => {
  const { id: csmId } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Check permissions
  if (currentUserId !== csmId && !['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const assignments = await csmAssignmentService.getByCSM(csmId);

  res.status(200).json({
    success: true,
    data: { assignments }
  });
});

// @desc    Update user profile (self-service)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fullName, phone, bio, avatar, preferences } = req.body;

  const allowedUpdates = {};
  if (fullName !== undefined) allowedUpdates.full_name = fullName;
  if (phone !== undefined) allowedUpdates.phone = phone;
  if (bio !== undefined) allowedUpdates.bio = bio;
  if (avatar !== undefined) allowedUpdates.avatar = avatar;
  if (preferences !== undefined) allowedUpdates.preferences = preferences;

  if (Object.keys(allowedUpdates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  try {
    const updatedUser = await userService.update(userId, allowedUpdates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
          preferences: updatedUser.preferences,
          updated_at: updatedUser.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin/Superadmin/CSM)
const getUserStats = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  if (!['admin', 'superadmin', 'csm'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions to view user statistics.'
    });
  }

  try {
    const { query } = require('../services/database');
    let statsResult;
    
    if (currentUserRole === 'superadmin') {
      // Superadmin sees all user stats
      statsResult = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'csm' THEN 1 END) as csm_count,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
          COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as recently_active
        FROM users 
        WHERE status != 'deleted'
      `);
    } else if (currentUserRole === 'admin') {
      // Admin sees CSMs and regular users only
      statsResult = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          0 as superadmin_count,
          0 as admin_count,
          COUNT(CASE WHEN role = 'csm' THEN 1 END) as csm_count,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
          COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as recently_active
        FROM users 
        WHERE status != 'deleted' AND role IN ('csm', 'user')
      `);
    } else if (currentUserRole === 'csm') {
      // CSM sees only users in their assigned accounts
      const { csmAssignmentService } = require('../services/database');
      const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
      const accountIds = csmAssignments.map(assignment => assignment.account_id);
      
      if (accountIds.length === 0) {
        statsResult = { rows: [{ 
          total_users: 0, active_users: 0, inactive_users: 0,
          superadmin_count: 0, admin_count: 0, csm_count: 0, user_count: 0, recently_active: 0 
        }] };
      } else {
        statsResult = await query(`
          SELECT 
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_users,
            COUNT(DISTINCT CASE WHEN u.status = 'inactive' THEN u.id END) as inactive_users,
            0 as superadmin_count,
            0 as admin_count,
            0 as csm_count,
            COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as user_count,
            COUNT(DISTINCT CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN u.id END) as recently_active
          FROM users u
          INNER JOIN user_accounts ua ON u.id = ua.user_id
          WHERE u.status != 'deleted' 
            AND u.role = 'user'
            AND ua.account_id = ANY($1::bigint[])
        `, [accountIds]);
      }
    }

    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(stats.total_users),
        active: parseInt(stats.active_users),
        inactive: parseInt(stats.inactive_users),
        byRole: {
          superadmin: parseInt(stats.superadmin_count),
          admin: parseInt(stats.admin_count),
          csm: parseInt(stats.csm_count),
          user: parseInt(stats.user_count)
        },
        recentlyActive: parseInt(stats.recently_active)
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user statistics'
    });
  }
});

// @desc    Get CSM dashboard with account health overview
// @route   GET /api/users/csm/dashboard
// @access  Private (CSM)
const getCsmDashboard = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Check if user is CSM
  if (currentUserRole !== 'csm') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This endpoint is only available for CSMs.'
    });
  }

  try {
    // Get CSM assignments
    const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
    const assignedAccountIds = csmAssignments.map(assignment => assignment.account_id);

    // Mock account health data - in real implementation, this would come from the database
    const mockHealthScores = [
      { clientId: 1, companyName: 'Premium Fleet Services', overallScore: 92, riskLevel: 'low', churnProbability: 5.0 },
      { clientId: 2, companyName: 'Elite Car Rentals', overallScore: 87, riskLevel: 'low', churnProbability: 8.5 },
      { clientId: 3, companyName: 'Coastal Vehicle Co', overallScore: 75, riskLevel: 'medium', churnProbability: 18.0 },
      { clientId: 4, companyName: 'Metro Transit Solutions', overallScore: 68, riskLevel: 'medium', churnProbability: 25.5 },
      { clientId: 5, companyName: 'Sunshine Auto Rental', overallScore: 45, riskLevel: 'critical', churnProbability: 65.0 }
    ];

    const mockAlerts = [
      { clientId: 3, severity: 'medium', alertType: 'usage_decline', status: 'active' },
      { clientId: 4, severity: 'high', alertType: 'engagement_drop', status: 'active' },
      { clientId: 5, severity: 'critical', alertType: 'payment_overdue', status: 'active' }
    ];

    if (assignedAccountIds.length === 0) {
      return res.json({
        success: true,
        data: {
          assignedAccounts: [],
          accountHealth: {
            totalAccounts: 0,
            healthyAccounts: 0,
            atRiskAccounts: 0,
            criticalAccounts: 0,
            averageHealthScore: 0
          },
          alerts: {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0
          },
          recentActivity: []
        }
      });
    }

    // Filter health data for assigned accounts
    const assignedHealthScores = mockHealthScores.filter(score => 
      assignedAccountIds.includes(score.clientId)
    );

    const assignedAlerts = mockAlerts.filter(alert => 
      assignedAccountIds.includes(alert.clientId) && alert.status === 'active'
    );

    // Calculate health summary
    const healthSummary = {
      totalAccounts: assignedHealthScores.length,
      healthyAccounts: assignedHealthScores.filter(score => score.riskLevel === 'low').length,
      atRiskAccounts: assignedHealthScores.filter(score => score.riskLevel === 'medium').length,
      criticalAccounts: assignedHealthScores.filter(score => score.riskLevel === 'critical').length,
      averageHealthScore: assignedHealthScores.length > 0 ? Math.round(
        assignedHealthScores.reduce((sum, score) => sum + score.overallScore, 0) / 
        assignedHealthScores.length
      ) : 0
    };

    // Calculate alerts summary
    const alertsSummary = {
      total: assignedAlerts.length,
      critical: assignedAlerts.filter(alert => alert.severity === 'critical').length,
      high: assignedAlerts.filter(alert => alert.severity === 'high').length,
      medium: assignedAlerts.filter(alert => alert.severity === 'medium').length
    };

    // Prepare account list with health info
    const accountsWithHealth = csmAssignments.map(assignment => {
      const healthData = assignedHealthScores.find(score => score.clientId === assignment.account_id);
      const accountAlerts = assignedAlerts.filter(alert => alert.clientId === assignment.account_id);
      
      return {
        accountId: assignment.account_id,
        accountName: assignment.account_name,
        companyName: assignment.company_name,
        isPrimary: assignment.is_primary,
        assignedAt: assignment.assigned_at,
        healthScore: healthData ? healthData.overallScore : null,
        riskLevel: healthData ? healthData.riskLevel : 'unknown',
        activeAlerts: accountAlerts.length,
        churnProbability: healthData ? healthData.churnProbability : null
      };
    });

    // Sort accounts by risk level (critical first)
    const riskOrder = { 'critical': 3, 'medium': 2, 'low': 1, 'unknown': 0 };
    accountsWithHealth.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);

    res.json({
      success: true,
      data: {
        assignedAccounts: accountsWithHealth,
        accountHealth: healthSummary,
        alerts: alertsSummary,
        recentActivity: assignedAlerts.slice(0, 5).map(alert => ({
          clientId: alert.clientId,
          companyName: assignedHealthScores.find(s => s.clientId === alert.clientId)?.companyName || 'Unknown',
          alertType: alert.alertType,
          severity: alert.severity,
          createdAt: new Date().toISOString()
        }))
      }
    });

  } catch (error) {
    console.error('Error getting CSM dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving CSM dashboard data'
    });
  }
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignCSMToAccounts,
  getCSMAssignments,
  updateProfile,
  getUserStats,
  getCsmDashboard
};
