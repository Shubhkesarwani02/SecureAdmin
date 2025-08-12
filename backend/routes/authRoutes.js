const express = require('express');
const { 
  login,
  refreshToken,
  getMe,
  logout,
  startImpersonation,
  stopImpersonation,
  getActiveImpersonations,
  getImpersonationHistory,
  changePassword
} = require('../controllers/authController');
const { 
  verifyToken, 
  requireAdmin, 
  sensitiveOperationLimit,
  canImpersonate
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(verifyToken); // Apply to all routes below

// Basic authenticated routes
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/change-password', sensitiveOperationLimit, changePassword);

// Impersonation routes (Admin/Superadmin only with enhanced checks)
router.post('/impersonate/start', requireAdmin, canImpersonate, sensitiveOperationLimit, startImpersonation);
router.post('/impersonate/stop', stopImpersonation);
router.get('/impersonate/active', requireAdmin, getActiveImpersonations);
router.get('/impersonate/history', requireAdmin, getImpersonationHistory);

module.exports = router;