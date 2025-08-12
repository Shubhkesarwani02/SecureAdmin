const express = require('express');
const {
  assignUserToAccount,
  removeUserFromAccount,
  getUserAccountAssignments,
  getAccountUserAssignments,
  getCSMAssignmentsOverview,
  getAssignmentStats,
  bulkAssignUsersToAccount,
  getAvailableUsers,
  getAvailableCSMs,
  getUnassignedAccounts,
  getUnassignedUsers
} = require('../controllers/assignmentController');
const {
  verifyToken,
  requireAdmin,
  requireAuthenticated,
  requireCSMOrAbove,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Assignment statistics (Admin/Superadmin only)
router.get('/stats', requireAdmin, getAssignmentStats);

// CSM assignments overview (Admin/Superadmin only)
router.get('/csm-overview', requireAdmin, getCSMAssignmentsOverview);

// Helper endpoints for UI (Admin/Superadmin only)
router.get('/available-users', requireAdmin, getAvailableUsers);
router.get('/available-csms', requireAdmin, getAvailableCSMs);
router.get('/unassigned-accounts', requireAdmin, getUnassignedAccounts);
router.get('/unassigned-users', requireAdmin, getUnassignedUsers);

// User to Account assignment routes
router.post('/user-accounts', requireAdmin, sensitiveOperationLimit, assignUserToAccount);
router.delete('/user-accounts/:userId/:accountId', requireAdmin, removeUserFromAccount);

// Bulk assignments (Admin/Superadmin only)
router.post('/bulk/users-to-account', requireAdmin, sensitiveOperationLimit, bulkAssignUsersToAccount);

// Assignment viewing routes
router.get('/users/:userId/accounts', requireAuthenticated, getUserAccountAssignments);
router.get('/accounts/:accountId/users', requireCSMOrAbove, getAccountUserAssignments);

module.exports = router;
