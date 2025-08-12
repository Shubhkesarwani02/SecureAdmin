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

  // Apply role-based filtering
  if (currentUserRole === 'admin') {
    // Admin can see CSMs and regular users, but not other admins or superadmins
    if (!role) {
      options.role = ['csm', 'user'];
    } else if (!['csm', 'user'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot view users with this role.'
      });
    }
  } else if (currentUserRole === 'csm') {
    // CSM can only see users in their assigned accounts
    return res.status(403).json({
      success: false,
      message: 'Access denied. CSMs cannot list all users.'
    });
  }

  const result = await userService.getAll(options);

  // Log the action
  await auditService.log({
    userId: req.user.id,
    impersonatorId: req.user.impersonator_id,
    action: 'USERS_LISTED',
    resourceType: 'USER',
    resourceId: null,
    oldValues: null,
    newValues: { filters: options },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    data: result
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
      // Additional logic would be needed to check account assignments
      return res.status(403).json({
        success: false,
        message: 'Access denied. CSM can only view users in assigned accounts.'
      });
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
      return res.status(403).json({
        success: false,
        message: 'CSM cannot update other users'
      });
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

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignCSMToAccounts,
  getCSMAssignments,
  updateProfile
};
