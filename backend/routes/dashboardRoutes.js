const express = require('express');
const { 
  getDashboardSummary,
  getSystemMonitoring,
  getAnalytics
} = require('../controllers/dashboardController');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require superadmin access
router.use(requireSuperAdmin);

router.get('/summary', getDashboardSummary);
router.get('/monitoring', getSystemMonitoring);
router.get('/analytics', getAnalytics);

module.exports = router;