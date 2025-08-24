const express = require('express');
const {
  getSystemMonitoring,
  refreshSystemMetrics,
  getSystemHealth,
  getErrorLogs,
  restartService,
  getServiceDetails,
  getPerformanceMetrics,
  getResourceUsage
} = require('../controllers/systemController');
const {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// System monitoring (Admin/Superadmin)
router.get('/monitoring', requireAdmin, getSystemMonitoring);
router.get('/health', requireAdmin, getSystemHealth);
router.get('/performance', requireAdmin, getPerformanceMetrics);
router.get('/resources', requireAdmin, getResourceUsage);

// System metrics (Admin/Superadmin)
router.post('/refresh-metrics', requireAdmin, refreshSystemMetrics);

// Error logs (Admin/Superadmin)
router.get('/logs/errors', requireAdmin, getErrorLogs);

// Service management (Superadmin only with rate limiting)
router.post('/restart/:service', requireSuperAdmin, sensitiveOperationLimit, restartService);
router.get('/services/:service', requireSuperAdmin, getServiceDetails);

module.exports = router;
