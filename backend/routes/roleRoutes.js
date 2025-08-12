const express = require('express');
const { 
  assignRole,
  getUserRoles
} = require('../controllers/roleController');
const { 
  verifyToken, 
  requireAdmin, 
  sensitiveOperationLimit 
} = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Role assignment routes (Admin/Superadmin only)
router.post('/assign', requireAdmin, sensitiveOperationLimit, assignRole);

// Get user roles and assignments (Admin/Superadmin only)
router.get('/:userId', requireAdmin, getUserRoles);

module.exports = router;
