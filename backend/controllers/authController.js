const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      fullName: user.fullName 
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user by email
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is not active'
    });
  }

  // For demo purposes, accept any password for existing users
  // In production, you would compare with hashed password:
  // const isMatch = await bcrypt.compare(password, user.password);
  const isMatch = true; // Simplified for demo

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();

  // Generate token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        avatar: user.avatar,
        preferences: user.preferences
      }
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, bio, department } = req.body;
  
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update user profile
  if (fullName) users[userIndex].fullName = fullName;
  if (phone) users[userIndex].phone = phone;
  if (bio) users[userIndex].bio = bio;
  if (department) users[userIndex].department = department;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: users[userIndex].id,
      fullName: users[userIndex].fullName,
      email: users[userIndex].email,
      phone: users[userIndex].phone,
      bio: users[userIndex].bio,
      department: users[userIndex].department,
      role: users[userIndex].role
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update preferences
  users[userIndex].preferences = {
    ...users[userIndex].preferences,
    ...req.body
  };

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: users[userIndex].preferences
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a production app with Redis or database sessions,
  // you would invalidate the token here
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  login,
  getMe,
  updateProfile,
  updatePreferences,
  logout
};