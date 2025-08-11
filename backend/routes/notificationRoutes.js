const express = require('express');
const { 
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification
} = require('../controllers/notificationController');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(verifyToken);

router.route('/')
  .get(getNotifications)
  .post(requireSuperAdmin, createNotification);

router.patch('/read-all', markAllNotificationsAsRead);

router.route('/:id')
  .delete(deleteNotification);

router.patch('/:id/read', markNotificationAsRead);

module.exports = router;