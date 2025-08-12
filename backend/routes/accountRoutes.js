const express = require('express');
const { 
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  assignCSMToAccount,
  removeCSMFromAccount,
  getAccountStats,
  getAccountUsers
} = require('../controllers/accountController');
const { 
  verifyToken, 
  requireAdmin, 
  requireSuperAdmin, 
  requireCSMOrAbove,
  checkAccountAccess,
  sensitiveOperationLimit 
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Account listing (CSM/Admin/Superadmin)
router.get('/', requireCSMOrAbove, getAccounts);

// Account statistics (Admin/Superadmin only)
router.get('/stats', requireAdmin, getAccountStats);

// Account creation (Admin/Superadmin only)
router.post('/', requireAdmin, sensitiveOperationLimit, createAccount);

// Individual account routes
router.get('/:id', requireCSMOrAbove, checkAccountAccess, getAccount);
router.get('/:id/users', requireCSMOrAbove, checkAccountAccess, getAccountUsers);
router.put('/:id', requireAdmin, updateAccount);
router.delete('/:id', requireSuperAdmin, sensitiveOperationLimit, deleteAccount);

// CSM assignment routes (Admin/Superadmin only)
router.post('/:id/assign-csm', requireAdmin, assignCSMToAccount);
router.delete('/:id/csm/:csmId', requireAdmin, removeCSMFromAccount);

module.exports = router;
