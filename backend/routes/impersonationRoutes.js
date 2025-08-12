const express = require('express');
const router = express.Router();
const ImpersonationController = require('../controllers/impersonationController');
const auth = require('../middleware/auth');

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Admin permissions required'
        });
    }
    next();
};

// Middleware to check superadmin permissions
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Superadmin permissions required'
        });
    }
    next();
};

// Impersonation Session Management
router.post('/start', auth, requireAdmin, ImpersonationController.startImpersonation);
router.post('/end', auth, ImpersonationController.endImpersonation);
router.get('/status', auth, ImpersonationController.getImpersonationStatus);

// Impersonation Logs and History
router.get('/logs', auth, requireAdmin, ImpersonationController.getImpersonationLogs);
router.get('/history/:userId?', auth, ImpersonationController.getUserImpersonationHistory);
router.get('/active-sessions', auth, requireAdmin, ImpersonationController.getActiveImpersonationSessions);

// Admin Management
router.post('/force-end/:sessionId', auth, requireSuperAdmin, ImpersonationController.forceEndImpersonation);

module.exports = router;
