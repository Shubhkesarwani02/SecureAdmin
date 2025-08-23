const express = require('express');
const {
  sendInvitation,
  validateInvitation,
  completeOnboarding,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  getInvitationStats
} = require('../controllers/inviteController');
const {
  verifyToken,
  requireAdmin,
  requireCSMOrAbove,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.get('/validate/:token', validateInvitation);
router.post('/complete', completeOnboarding);

// Protected routes
router.use(verifyToken); // Apply authentication to all routes below

// Get invitation statistics (CSM/Admin/Superadmin)
router.get('/stats', requireCSMOrAbove, getInvitationStats);

// Get invitations list (CSM/Admin/Superadmin)
router.get('/', requireCSMOrAbove, getInvitations);

// Send invitation (Admin/Superadmin only)
router.post('/', requireAdmin, sensitiveOperationLimit, sendInvitation);

// Resend invitation (Admin/Superadmin only)
router.post('/:id/resend', requireAdmin, sensitiveOperationLimit, resendInvitation);

// Cancel invitation (Admin/Superadmin only)
router.delete('/:id', requireAdmin, sensitiveOperationLimit, cancelInvitation);

module.exports = router;
