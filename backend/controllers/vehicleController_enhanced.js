const { asyncHandler } = require('../middleware/errorHandler');
const { query, auditService } = require('../services/database');

// NOTE: Ensure a vehicles table exists in your DB schema as per report

// @desc    Get vehicles with basic filtering
// @route   GET /api/vehicles
// @access  Private (Superadmin)
const getVehicles = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit), 100);
  const offset = (parseInt(page) - 1) * limitNum;

  const where = [];
  const params = [];
  let idx = 1;

  if (status) {
    where.push(`status = $${idx++}`);
    params.push(status);
  }

  if (search) {
    where.push(`(make ILIKE $${idx} OR model ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countResult, dataResult] = await Promise.all([
    query(`SELECT COUNT(*) AS total FROM vehicles ${whereClause}`, params),
    query(
      `SELECT * FROM vehicles ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private (Superadmin)
const getVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  res.status(200).json({ success: true, data: result.rows[0] });
});

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private (Superadmin)
const createVehicle = asyncHandler(async (req, res) => {
  const { account_id, make, model, year, status = 'active' } = req.body;

  if (!account_id || !make || !model) {
    return res.status(400).json({ success: false, message: 'account_id, make and model are required' });
  }

  const result = await query(
    `INSERT INTO vehicles (account_id, make, model, year, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [account_id, make, model, year || null, status]
  );

  await auditService.log({
    userId: req.user.id,
    action: 'VEHICLE_CREATED',
    resourceType: 'VEHICLE',
    resourceId: result.rows[0].id,
    oldValues: null,
    newValues: req.body,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({ success: true, data: result.rows[0] });
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Superadmin)
const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  let idx = 1;

  Object.entries(req.body).forEach(([key, value]) => {
    fields.push(`${key} = $${idx++}`);
    values.push(value);
  });

  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  values.push(id);

  const result = await query(
    `UPDATE vehicles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  await auditService.log({
    userId: req.user.id,
    action: 'VEHICLE_UPDATED',
    resourceType: 'VEHICLE',
    resourceId: id,
    oldValues: null,
    newValues: req.body,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, data: result.rows[0] });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Superadmin)
const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  await auditService.log({
    userId: req.user.id,
    action: 'VEHICLE_DELETED',
    resourceType: 'VEHICLE',
    resourceId: id,
    oldValues: result.rows[0],
    newValues: null,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, message: 'Vehicle deleted' });
});

// @desc    Vehicle stats
// @route   GET /api/vehicles/stats
// @access  Private (Superadmin)
const getVehicleStats = asyncHandler(async (req, res) => {
  const totalResult = await query('SELECT COUNT(*) AS total FROM vehicles');
  const activeResult = await query("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'active'");
  const maintenanceResult = await query("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'maintenance'");

  res.status(200).json({
    success: true,
    data: {
      total: parseInt(totalResult.rows[0].total || '0'),
      active: parseInt(activeResult.rows[0].total || '0'),
      maintenance: parseInt(maintenanceResult.rows[0].total || '0')
    }
  });
});

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
};
