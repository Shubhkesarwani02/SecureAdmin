const express = require('express');
const {
  getImpersonationHistory,
  getImpersonationStats,
  getCurrentImpersonations,
  terminateImpersonation,
  getImpersonationDetails
} = require('../controllers/impersonationController');
const {
  startImpersonation,
  stopImpersonation,
  getActiveSessions,
  logImpersonationAction
} = require('../controllers/impersonationController_enhanced');
const {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireAuthenticated,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Enhanced impersonation endpoints
router.post('/start', requireAdmin, startImpersonation);
router.post('/stop', requireAuthenticated, stopImpersonation);
router.get('/active', requireAdmin, getActiveSessions);
router.post('/log-action', requireAuthenticated, logImpersonationAction);

// Original impersonation endpoints
router.get('/history', requireAdmin, getImpersonationHistory);
router.get('/stats', requireAdmin, getImpersonationStats);
router.get('/current', requireAdmin, getCurrentImpersonations);
router.get('/:id/details', requireAdmin, getImpersonationDetails);

// Emergency termination (Superadmin only with rate limiting)
router.post('/:id/terminate', requireSuperAdmin, sensitiveOperationLimit, terminateImpersonation);

module.exports = router;
