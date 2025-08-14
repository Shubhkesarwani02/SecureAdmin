const express = require('express');
const router = express.Router();
const ImpersonationController = require('../controllers/impersonationController');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Impersonation Session Management
router.post('/start', requireAdmin, ImpersonationController.startImpersonation);
router.post('/end', ImpersonationController.endImpersonation);
router.get('/status', ImpersonationController.getImpersonationStatus);

// Impersonation Logs and History
router.get('/logs', requireAdmin, ImpersonationController.getImpersonationLogs);
router.get('/history/:userId?', ImpersonationController.getUserImpersonationHistory);
router.get('/active-sessions', requireAdmin, ImpersonationController.getActiveImpersonationSessions);

// Statistics and Analytics
router.get('/stats', requireAdmin, ImpersonationController.getImpersonationStats);

// Admin Management
router.post('/force-end/:sessionId', requireSuperAdmin, ImpersonationController.forceEndImpersonation);

// Utility Endpoints
router.post('/validate-token', ImpersonationController.validateImpersonationToken);

module.exports = router;
