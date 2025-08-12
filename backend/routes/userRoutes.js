const express = require('express');
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignCSMToAccounts,
  getCSMAssignments,
  updateProfile
} = require('../controllers/userController_enhanced');
const { 
  verifyToken, 
  requireAdmin, 
  requireAuthenticated, 
  canManageUser,
  sensitiveOperationLimit,
  canManageAllCustomers
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Profile routes (any authenticated user)
router.put('/profile', updateProfile);

// User listing and creation (Admin/Superadmin only)
router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, sensitiveOperationLimit, createUser);

// CSM assignment routes (Admin/Superadmin only)
router.post('/:id/assign-accounts', canManageAllCustomers, sensitiveOperationLimit, assignCSMToAccounts);
router.get('/:id/assignments', requireAuthenticated, getCSMAssignments);

// Individual user routes
router.route('/:id')
  .get(requireAuthenticated, getUser)
  .put(requireAuthenticated, canManageUser, updateUser)
  .delete(requireAdmin, sensitiveOperationLimit, deleteUser);

module.exports = router;