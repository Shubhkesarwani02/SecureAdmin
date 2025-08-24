const { users } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Superadmin)
const getUsers = asyncHandler(async (req, res) => {
  const { 
    role, 
    status, 
    search, 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const currentUserRole = req.user.role;

  let filteredUsers = [...users];

  // Role-based filtering - Admins can see CSMs and Users, Superadmins can see all
  if (currentUserRole === 'admin') {
    filteredUsers = filteredUsers.filter(user => 
      user.role === 'csm' || user.role === 'user'
    );
  }

  // Apply additional filters
  if (role && role !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }

  if (status && status !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filteredUsers.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
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
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Remove sensitive data and add impersonation capability info
  const sanitizedUsers = paginatedUsers.map(user => {
    const { preferences, ...userWithoutPreferences } = user;
    
    // Add impersonation capability flag
    const canImpersonate = (currentUserRole === 'superadmin') || 
      (currentUserRole === 'admin' && (user.role === 'csm' || user.role === 'user'));
    
    return {
      ...userWithoutPreferences,
      canImpersonate
    };
  });

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / parseInt(limit));

  res.status(200).json({
    success: true,
    data: sanitizedUsers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalUsers,
      hasNext: endIndex < totalUsers,
      hasPrev: startIndex > 0
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Superadmin)
const getUser = asyncHandler(async (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove sensitive preferences for other users
  if (req.user.id !== user.id) {
    const { preferences, ...userWithoutPreferences } = user;
    return res.status(200).json({
      success: true,
      data: userWithoutPreferences
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Superadmin)
const createUser = asyncHandler(async (req, res) => {
  const { 
    fullName, 
    email, 
    phone, 
    role, 
    department,
    permissions = []
  } = req.body;

  // Validate required fields
  if (!fullName || !email || !role) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email, and role are required'
    });
  }

  // Check if email already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Only superadmins can create other superadmins
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Only superadmins can create superadmin users'
    });
  }

  // Create new user
  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    fullName,
    email,
    phone: phone || null,
    role,
    department: department || 'General',
    status: 'active',
    avatar: null,
    bio: '',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: permissions,
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      marketingEmails: false,
      twoFactorAuth: false,
      sessionTimeout: "8",
      language: "en",
      timezone: "America/New_York",
      theme: "light"
    }
  };

  // Add to users array
  users.push(newUser);

  // Remove sensitive data from response
  const { preferences, ...userResponse } = newUser;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userResponse
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Superadmin)
const updateUser = asyncHandler(async (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent users from updating their own role
  if (req.user.id === users[userIndex].id && req.body.role) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update your own role'
    });
  }

  // Only superadmins can update superadmin users
  if (users[userIndex].role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Only superadmins can update superadmin users'
    });
  }

  const allowedUpdates = ['fullName', 'email', 'phone', 'role', 'department', 'status', 'permissions'];
  const updates = {};

  // Filter only allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Remove sensitive data from response
  const { preferences, ...userResponse } = users[userIndex];

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: userResponse
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Superadmin)
const deleteUser = asyncHandler(async (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent users from deleting themselves
  if (req.user.id === users[userIndex].id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  // Only superadmins can delete superadmin users
  if (users[userIndex].role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Only superadmins can delete superadmin users'
    });
  }

  // Instead of deleting, set status to inactive
  users[userIndex].status = 'inactive';
  users[userIndex].updatedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Superadmin)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    byRole: {
      superadmin: users.filter(u => u.role === 'superadmin').length,
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length
    },
    byDepartment: users.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    }, {}),
    recentlyActive: users.filter(u => 
      u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};