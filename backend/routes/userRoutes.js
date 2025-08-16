const express = require('express');
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignCSMToAccounts,
  getCSMAssignments,
  updateProfile,
  getUserStats
} = require('../controllers/userController_enhanced');
const { 
  verifyToken, 
  requireAdmin, 
  requireAuthenticated, 
  requireCSMOrAbove,
  canManageUser,
  checkCSMUserAccess,
  sensitiveOperationLimit,
  canManageAllCustomers
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Profile routes (any authenticated user)
router.put('/profile', updateProfile);

// User listing (CSM/Admin/Superadmin can list users based on their access level)
router.get('/', requireCSMOrAbove, getUsers);

// User statistics (Admin/Superadmin only) - MUST come before /:id route
router.get('/stats', requireAdmin, getUserStats);

// User creation (Admin/Superadmin only)
router.post('/', requireAdmin, sensitiveOperationLimit, createUser);

// CSM assignment routes (Admin/Superadmin only)
router.post('/:id/assign-accounts', canManageAllCustomers, sensitiveOperationLimit, assignCSMToAccounts);
router.get('/:id/assignments', requireAuthenticated, getCSMAssignments);

// Individual user routes
router.route('/:id')
  .get(requireAuthenticated, checkCSMUserAccess, getUser)
  .put(requireAuthenticated, canManageUser, updateUser)
  .delete(requireAdmin, sensitiveOperationLimit, deleteUser);

module.exports = router;