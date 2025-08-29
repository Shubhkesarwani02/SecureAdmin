const express = require('express');
const { 
  getSystemMonitoring,
  getAnalytics
} = require('../controllers/dashboardController');
const {
  getDashboardSummary,
  getDashboardMetrics,
  getAccountHealthOverview,
  getRevenueAnalytics
} = require('../controllers/dashboardController_database');
const {
  getQuickActions,
  generateMonthlyReport,
  downloadReport
} = require('../controllers/userPreferencesController');
const { requireAuthenticated } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(requireAuthenticated);

// Database-driven dashboard routes
router.get('/summary', getDashboardSummary);
router.get('/metrics', getDashboardMetrics);
router.get('/health', getAccountHealthOverview);
router.get('/revenue', getRevenueAnalytics);

// Legacy routes
router.get('/monitoring', getSystemMonitoring);
router.get('/analytics', getAnalytics);
router.get('/quick-actions', getQuickActions);
router.post('/generate-report', generateMonthlyReport);
router.get('/download-report/:fileName', downloadReport);

module.exports = router;