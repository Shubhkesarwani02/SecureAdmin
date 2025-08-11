const { notifications } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { unread = 'false', limit = 50 } = req.query;

  let filteredNotifications = [...notifications];

  // Filter by read status
  if (unread === 'true') {
    filteredNotifications = filteredNotifications.filter(n => !n.read);
  }

  // Apply limit
  if (limit) {
    filteredNotifications = filteredNotifications.slice(0, parseInt(limit));
  }

  // Sort by created date (newest first)
  filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = notifications.filter(n => !n.read).length;

  res.status(200).json({
    success: true,
    data: filteredNotifications,
    meta: {
      unreadCount,
      total: notifications.length
    }
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notificationIndex = notifications.findIndex(n => n.id === parseInt(req.params.id));
  
  if (notificationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  notifications[notificationIndex].read = true;

  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  notifications.forEach(notification => {
    notification.read = true;
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Create new notification (for system use)
// @route   POST /api/notifications
// @access  Private (Superadmin)
const createNotification = asyncHandler(async (req, res) => {
  const { title, description, type = 'info', priority = 'medium' } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required'
    });
  }

  const newNotification = {
    id: Math.max(...notifications.map(n => n.id)) + 1,
    title,
    description,
    type,
    priority,
    read: false,
    createdAt: new Date().toISOString(),
    userId: null, // Global notification
    actionRequired: false
  };

  notifications.unshift(newNotification); // Add to beginning

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: newNotification
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notificationIndex = notifications.findIndex(n => n.id === parseInt(req.params.id));
  
  if (notificationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  notifications.splice(notificationIndex, 1);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification
};