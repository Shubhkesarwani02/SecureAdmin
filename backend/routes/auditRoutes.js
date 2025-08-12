const express = require('express');
const { 
  getAuditLogs,
  getImpersonationLogs,
  getAuditStats,
  exportAuditLogs
} = require('../controllers/auditController');
const { 
  verifyToken, 
  requireAdmin, 
  requireSuperAdmin 
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Audit log routes (Admin/Superadmin only)
router.get('/logs', requireAdmin, getAuditLogs);
router.get('/impersonation', requireAdmin, getImpersonationLogs);
router.get('/stats', requireAdmin, getAuditStats);

// Export routes (Superadmin only)
router.get('/export', requireSuperAdmin, exportAuditLogs);

module.exports = router;
