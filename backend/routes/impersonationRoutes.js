const express = require('express');
const {
  getImpersonationHistory,
  getImpersonationStats,
  getCurrentImpersonations,
  terminateImpersonation,
  getImpersonationDetails
} = require('../controllers/impersonationController');
const {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Impersonation history (Admin/Superadmin)
router.get('/history', requireAdmin, getImpersonationHistory);
router.get('/stats', requireAdmin, getImpersonationStats);
router.get('/current', requireAdmin, getCurrentImpersonations);
router.get('/:id/details', requireAdmin, getImpersonationDetails);

// Emergency termination (Superadmin only with rate limiting)
router.post('/:id/terminate', requireSuperAdmin, sensitiveOperationLimit, terminateImpersonation);

module.exports = router;
