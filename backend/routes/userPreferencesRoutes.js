const express = require('express');
const router = express.Router();
const {
  getUserPreferences,
  updateUserPreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getQuickActions,
  generateMonthlyReport,
  downloadReport
} = require('../controllers/userPreferencesController');
const { requireAuthenticated } = require('../middleware/auth');

// User preferences routes
router.get('/preferences', requireAuthenticated, getUserPreferences);
router.put('/preferences', requireAuthenticated, updateUserPreferences);

// Notification settings routes
router.get('/notification-settings', requireAuthenticated, getNotificationSettings);
router.put('/notification-settings', requireAuthenticated, updateNotificationSettings);

module.exports = router;
