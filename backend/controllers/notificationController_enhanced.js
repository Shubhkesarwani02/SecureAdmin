const { asyncHandler } = require('../middleware/errorHandler');
const { query, auditService } = require('../services/database');

// @desc    Get notifications (global + user-specific)
// @route   GET /api/notifications
// @access  Private (any authenticated user)
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const { page = 1, limit = 20 } = req.query;

  const limitNum = Math.min(parseInt(limit), 100);
  const offset = (parseInt(page) - 1) * limitNum;

  const where = [];
  const params = [];
  // Fetch global notifications (user_id IS NULL) and user-specific
  where.push('(user_id IS NULL OR user_id = $1)');
  params.push(userId);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countResult, dataResult] = await Promise.all([
    query(`SELECT COUNT(*) AS total FROM notifications ${whereClause}`, params),
    query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [...params, limitNum, offset]
    )
  ]);

  res.status(200).json({
    success: true,
    data: dataResult.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum),
      totalItems: parseInt(countResult.rows[0].total),
      hasNext: offset + limitNum < parseInt(countResult.rows[0].total),
      hasPrev: offset > 0
    }
  });
});

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || null;

  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND (user_id IS NULL OR user_id = $2)
     RETURNING *`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  res.status(200).json({ success: true, data: result.rows[0] });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;

  try {
    await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 OR user_id IS NULL`,
      [userId]
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private (Superadmin)
const createNotification = asyncHandler(async (req, res) => {
  const { title, description, type = 'info', priority = 'low', userId = null } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const result = await query(
    `INSERT INTO notifications (title, description, type, priority, is_read, user_id)
     VALUES ($1, $2, $3, $4, FALSE, $5)
     RETURNING *`,
    [title, description || '', type, priority, userId]
  );

  await auditService.log({
    userId: req.user.id,
    action: 'NOTIFICATION_CREATED',
    resourceType: 'NOTIFICATION',
    resourceId: result.rows[0].id,
    oldValues: null,
    newValues: { title, type, priority, userId },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({ success: true, data: result.rows[0] });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Superadmin)
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await auditService.log({
    userId: req.user.id,
    action: 'NOTIFICATION_DELETED',
    resourceType: 'NOTIFICATION',
    resourceId: id,
    oldValues: result.rows[0],
    newValues: null,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, message: 'Notification deleted' });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification
};
