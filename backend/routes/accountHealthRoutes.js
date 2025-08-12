const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAccountHealthOverview,
  getAccountHealthScores,
  getAccountHealthAlerts,
  getClientHealthDetails,
  acknowledgeAlert,
  resolveAlert,
  getHighRiskClients,
  refreshHealthScores
} = require('../controllers/accountHealthController');

// Apply authentication to all routes
router.use(verifyToken);

// Account health overview - summary statistics (all authenticated users)
router.get('/overview', getAccountHealthOverview);

// Get all account health scores with optional filtering and sorting (SuperAdmin, Admin, CSM)
router.get('/scores', requireRole(['superadmin', 'admin', 'csm']), getAccountHealthScores);

// Get account health alerts with filtering options (SuperAdmin, Admin, CSM)
router.get('/alerts', requireRole(['superadmin', 'admin', 'csm']), getAccountHealthAlerts);

// Get detailed health information for a specific client (SuperAdmin, Admin, CSM)
router.get('/client/:clientId', requireRole(['superadmin', 'admin', 'csm']), getClientHealthDetails);

// Get high-risk clients specifically (SuperAdmin, Admin)
router.get('/high-risk', requireRole(['superadmin', 'admin']), getHighRiskClients);

// Acknowledge an alert (SuperAdmin, Admin, CSM)
router.post('/alerts/:alertId/acknowledge', requireRole(['superadmin', 'admin', 'csm']), acknowledgeAlert);

// Resolve an alert (SuperAdmin, Admin, CSM)
router.post('/alerts/:alertId/resolve', requireRole(['superadmin', 'admin', 'csm']), resolveAlert);

// Refresh all health scores (manual trigger) (SuperAdmin, Admin only)
router.post('/refresh-scores', requireRole(['superadmin', 'admin']), refreshHealthScores);

module.exports = router;