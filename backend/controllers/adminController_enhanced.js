const { asyncHandler } = require('../middleware/errorHandler');
const { query, auditService } = require('../services/database');

// @desc    Get admin settings (placeholder using DB-backed key-value store if available)
// @route   GET /api/admin/settings
// @access  Private (Superadmin)
const getAdminSettings = asyncHandler(async (req, res) => {
  // Optional: create a settings table; for now return sane defaults
  res.status(200).json({
    success: true,
    data: {
      maintenanceMode: false,
      allowInvitations: true,
      debugMode: false
    }
  });
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private (Superadmin)
const updateAdminSettings = asyncHandler(async (req, res) => {
  const updates = req.body || {};

  await auditService.log({
    userId: req.user.id,
    action: 'ADMIN_SETTINGS_UPDATED',
    resourceType: 'SYSTEM',
    resourceId: null,
    oldValues: null,
    newValues: updates,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, message: 'Settings updated', data: updates });
});

// @desc    Get system logs (audit logs)
// @route   GET /api/admin/logs
// @access  Private (Superadmin)
const getSystemLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const limitNum = Math.min(parseInt(limit), 200);
  const offset = (parseInt(page) - 1) * limitNum;

  const [countResult, dataResult] = await Promise.all([
    query('SELECT COUNT(*) AS total FROM audit_logs'),
    query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limitNum, offset])
  ]);

  res.status(200).json({
    success: true,
    data: dataResult.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum),
      totalItems: parseInt(countResult.rows[0].total)
    }
  });
});

// @desc    List integration codes
// @route   GET /api/admin/integration-codes
// @access  Private (Superadmin)
const getIntegrationCodes = asyncHandler(async (req, res) => {
  // Expect a table integration_codes (if not present, this will need schema addition)
  const result = await query('SELECT * FROM integration_codes ORDER BY created_at DESC');
  res.status(200).json({ success: true, data: result.rows });
});

// @desc    Generate integration code
// @route   POST /api/admin/integration-codes
// @access  Private (Superadmin)
const generateIntegrationCode = asyncHandler(async (req, res) => {
  const { client_id, type = 'general' } = req.body;

  const code = `FRAMTT_${type.toUpperCase()}_${new Date().getFullYear()}_${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const result = await query(
    `INSERT INTO integration_codes (code, client_id, type, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING *`,
    [code, client_id || null, type]
  );

  await auditService.log({
    userId: req.user.id,
    action: 'INTEGRATION_CODE_CREATED',
    resourceType: 'INTEGRATION_CODE',
    resourceId: result.rows[0].id,
    oldValues: null,
    newValues: result.rows[0],
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({ success: true, data: result.rows[0] });
});

// @desc    Deactivate integration code
// @route   DELETE /api/admin/integration-codes/:code
// @access  Private (Superadmin)
const deactivateIntegrationCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const result = await query(
    `UPDATE integration_codes SET status = 'inactive', updated_at = NOW() WHERE code = $1 RETURNING *`,
    [code]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Integration code not found' });
  }

  await auditService.log({
    userId: req.user.id,
    action: 'INTEGRATION_CODE_DEACTIVATED',
    resourceType: 'INTEGRATION_CODE',
    resourceId: result.rows[0].id,
    oldValues: null,
    newValues: { code, status: 'inactive' },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, data: result.rows[0] });
});

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  getSystemLogs,
  getIntegrationCodes,
  generateIntegrationCode,
  deactivateIntegrationCode
};
