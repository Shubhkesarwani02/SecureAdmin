const express = require('express');
const {
  getPaymentReports,
  exportPaymentData,
  processRefund,
  getIntegrationCodes,
  generateIntegrationCode,
  deleteIntegrationCode,
  getPaymentStats,
  getBillingHistory,
  getRevenueAnalytics
} = require('../controllers/paymentController');
const {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Payment reports and analytics (Admin/Superadmin)
router.get('/reports', requireAdmin, getPaymentReports);
router.get('/export', requireAdmin, exportPaymentData);
router.get('/stats', requireAdmin, getPaymentStats);
router.get('/billing-history', requireAdmin, getBillingHistory);
router.get('/revenue-analytics', requireAdmin, getRevenueAnalytics);

// Refund processing (Admin/Superadmin with rate limiting)
router.post('/refund', requireAdmin, sensitiveOperationLimit, processRefund);

// Integration codes (Superadmin only)
router.get('/integration-codes', requireSuperAdmin, getIntegrationCodes);
router.post('/integration-codes', requireSuperAdmin, generateIntegrationCode);
router.delete('/integration-codes/:id', requireSuperAdmin, deleteIntegrationCode);

module.exports = router;
