const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireCSMOrAbove } = require('../middleware/auth');
const {
  getAccountHealthOverview,
  getAccountHealthScores,
  getAccountHealthAlerts,
  getClientHealthDetails,
  acknowledgeAlert,
  resolveAlert,
  getHighRiskClients,
  refreshHealthScores,
  // CSM-specific functions
  getCsmAccountHealthOverview,
  getCsmAccountHealthScores,
  getCsmAccountHealthAlerts,
  getCsmClientHealthDetails
} = require('../controllers/accountHealthController');

// Apply authentication to all routes
router.use(verifyToken);

// Account health overview - summary statistics (all authenticated users)
router.get('/overview', getAccountHealthOverview);

// Get all account health scores with optional filtering and sorting (SuperAdmin, Admin, CSM)
router.get('/scores', requireAdmin, getAccountHealthScores);

// Get account health alerts with filtering options (SuperAdmin, Admin, CSM)
router.get('/alerts', requireAdmin, getAccountHealthAlerts);

// Get detailed health information for a specific client (SuperAdmin, Admin, CSM)
router.get('/client/:clientId', requireAdmin, getClientHealthDetails);

// Get high-risk clients specifically (SuperAdmin, Admin)
router.get('/high-risk', requireAdmin, getHighRiskClients);

// Acknowledge an alert (SuperAdmin, Admin, CSM)
router.post('/alerts/:alertId/acknowledge', requireAdmin, acknowledgeAlert);

// Resolve an alert (SuperAdmin, Admin, CSM)
router.post('/alerts/:alertId/resolve', requireAdmin, resolveAlert);

// Refresh all health scores (manual trigger) (SuperAdmin, Admin only)
router.post('/refresh-scores', requireAdmin, refreshHealthScores);

// CSM-specific routes - shows only assigned accounts
router.get('/csm/overview', requireCSMOrAbove, getCsmAccountHealthOverview);
router.get('/csm/scores', requireCSMOrAbove, getCsmAccountHealthScores);
router.get('/csm/alerts', requireCSMOrAbove, getCsmAccountHealthAlerts);
router.get('/csm/client/:clientId', requireCSMOrAbove, getCsmClientHealthDetails);

module.exports = router;