const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'framtt_superadmin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Generic query function with error handling
const query = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// User operations
const userService = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND status != $2',
      [email, 'deleted']
    );
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    return result.rows[0];
  },

  // Create new user
  create: async (userData) => {
    const {
      email,
      password,
      fullName,
      role,
      department,
      phone,
      createdBy
    } = userData;

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, department, phone, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role, department, phone, status, created_at`,
      [email, hashedPassword, fullName, role, department, phone, createdBy]
    );
    
    return result.rows[0];
  },

  // Update user
  update: async (id, updateData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key === 'password') {
        fields.push(`password_hash = $${paramCount}`);
        values.push(bcrypt.hashSync(updateData[key], parseInt(process.env.BCRYPT_ROUNDS) || 12));
      } else if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    values.push(id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, full_name, role, department, phone, status, updated_at`,
      values
    );
    
    return result.rows[0];
  },

  // Get users with pagination and filtering
  getAll: async (options = {}) => {
    const {
      role,
      status,
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let whereClause = "WHERE status != 'deleted'";
    const params = [];
    let paramCount = 1;

    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT id, email, full_name, role, department, phone, status, created_at, updated_at, last_login
       FROM users 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  },

  // Update last login
  updateLastLogin: async (id) => {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

// Account operations
const accountService = {
  // Get all accounts
  getAll: async (options = {}) => {
    const {
      status,
      subscriptionPlan,
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let whereClause = "WHERE status != 'deleted'";
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (subscriptionPlan) {
      whereClause += ` AND subscription_plan = $${paramCount}`;
      params.push(subscriptionPlan);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramCount} OR company_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT * FROM accounts 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM accounts ${whereClause}`,
      params
    );

    return {
      accounts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  },

  // Get accounts assigned to CSM
  getByCSM: async (csmId, options = {}) => {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let whereClause = "WHERE a.status != 'deleted' AND ca.csm_id = $1";
    const params = [csmId];
    let paramCount = 2;

    if (search) {
      whereClause += ` AND (a.name ILIKE $${paramCount} OR a.company_name ILIKE $${paramCount} OR a.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT a.*, ca.is_primary, ca.assigned_at, ca.notes
       FROM accounts a
       INNER JOIN csm_assignments ca ON a.id = ca.account_id
       ${whereClause}
       ORDER BY a.${sortBy} ${sortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      accounts: result.rows,
      total: result.rows.length
    };
  },

  // Find account by ID
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1 AND status != $2',
      [id, 'deleted']
    );
    return result.rows[0];
  },

  // Create account
  create: async (accountData) => {
    const {
      name,
      companyName,
      email,
      phone,
      address,
      integrationCode,
      subscriptionPlan,
      createdBy
    } = accountData;

    const result = await query(
      `INSERT INTO accounts (name, company_name, email, phone, address, integration_code, subscription_plan, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, companyName, email, phone, address, integrationCode, subscriptionPlan, createdBy]
    );
    
    return result.rows[0];
  }
};

// CSM Assignment operations
const csmAssignmentService = {
  // Assign CSM to account
  assign: async (assignmentData) => {
    const { csmId, accountId, assignedBy, isPrimary = false, notes } = assignmentData;
    
    const result = await query(
      `INSERT INTO csm_assignments (csm_id, account_id, assigned_by, is_primary, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (csm_id, account_id) 
       DO UPDATE SET is_primary = $4, notes = $5, updated_at = NOW()
       RETURNING *`,
      [csmId, accountId, assignedBy, isPrimary, notes]
    );
    
    return result.rows[0];
  },

  // Get CSM assignments
  getByCSM: async (csmId) => {
    const result = await query(
      `SELECT ca.*, a.name as account_name, a.company_name, a.email as account_email
       FROM csm_assignments ca
       INNER JOIN accounts a ON ca.account_id = a.id
       WHERE ca.csm_id = $1 AND a.status != 'deleted'
       ORDER BY ca.is_primary DESC, ca.assigned_at DESC`,
      [csmId]
    );
    
    return result.rows;
  },

  // Remove CSM assignment
  remove: async (csmId, accountId) => {
    const result = await query(
      'DELETE FROM csm_assignments WHERE csm_id = $1 AND account_id = $2 RETURNING *',
      [csmId, accountId]
    );
    
    return result.rows[0];
  }
};

// Impersonation operations
const impersonationService = {
  // Start impersonation session
  start: async (impersonationData) => {
    const {
      impersonatorId,
      impersonatedId,
      reason,
      ipAddress,
      userAgent,
      sessionId
    } = impersonationData;

    // End any existing active impersonation for this impersonator
    await query(
      `UPDATE impersonation_logs 
       SET end_time = NOW(), is_active = FALSE 
       WHERE impersonator_id = $1 AND is_active = TRUE`,
      [impersonatorId]
    );

    // Start new impersonation session
    const result = await query(
      `INSERT INTO impersonation_logs 
       (impersonator_id, impersonated_id, reason, ip_address, user_agent, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [impersonatorId, impersonatedId, reason, ipAddress, userAgent, sessionId]
    );

    // Update user impersonation status
    await query(
      `UPDATE users 
       SET is_impersonation_active = TRUE, current_impersonator_id = $1 
       WHERE id = $2`,
      [impersonatorId, impersonatedId]
    );

    return result.rows[0];
  },

  // End impersonation session
  end: async (impersonatorId, sessionId) => {
    const result = await query(
      `UPDATE impersonation_logs 
       SET end_time = NOW(), is_active = FALSE 
       WHERE impersonator_id = $1 AND session_id = $2 AND is_active = TRUE
       RETURNING *`,
      [impersonatorId, sessionId]
    );

    if (result.rows.length > 0) {
      // Update user impersonation status
      await query(
        `UPDATE users 
         SET is_impersonation_active = FALSE, current_impersonator_id = NULL 
         WHERE id = $1`,
        [result.rows[0].impersonated_id]
      );
    }

    return result.rows[0];
  },

  // Get active impersonation sessions
  getActive: async (impersonatorId) => {
    const result = await query(
      `SELECT il.*, u.full_name as impersonated_name, u.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users u ON il.impersonated_id = u.id
       WHERE il.impersonator_id = $1 AND il.is_active = TRUE
       ORDER BY il.start_time DESC`,
      [impersonatorId]
    );
    
    return result.rows;
  },

  // Get impersonation history
  getHistory: async (options = {}) => {
    const {
      impersonatorId,
      impersonatedId,
      page = 1,
      limit = 10,
      startDate,
      endDate
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (impersonatorId) {
      whereClause += ` AND il.impersonator_id = $${paramCount}`;
      params.push(impersonatorId);
      paramCount++;
    }

    if (impersonatedId) {
      whereClause += ` AND il.impersonated_id = $${paramCount}`;
      params.push(impersonatedId);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND il.start_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND il.start_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT il.*, 
              imp.full_name as impersonator_name, imp.email as impersonator_email,
              imp_ed.full_name as impersonated_name, imp_ed.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users imp ON il.impersonator_id = imp.id
       INNER JOIN users imp_ed ON il.impersonated_id = imp_ed.id
       ${whereClause}
       ORDER BY il.start_time DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      logs: result.rows,
      total: result.rows.length
    };
  }
};

// Audit log operations
const auditService = {
  // Log action
  log: async (logData) => {
    const {
      userId,
      impersonatorId,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    } = logData;

    const result = await query(
      `INSERT INTO audit_logs 
       (user_id, impersonator_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        impersonatorId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        ipAddress,
        userAgent
      ]
    );

    return result.rows[0];
  },

  // Get audit logs
  getLogs: async (options = {}) => {
    const {
      userId,
      action,
      resourceType,
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (userId) {
      whereClause += ` AND (al.user_id = $${paramCount} OR al.impersonator_id = $${paramCount})`;
      params.push(userId);
      paramCount++;
    }

    if (action) {
      whereClause += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (resourceType) {
      whereClause += ` AND al.resource_type = $${paramCount}`;
      params.push(resourceType);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND al.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND al.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT al.*, 
              u.full_name as user_name, u.email as user_email,
              imp.full_name as impersonator_name, imp.email as impersonator_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN users imp ON al.impersonator_id = imp.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      logs: result.rows,
      total: result.rows.length
    };
  }
};

// Refresh token operations
const tokenService = {
  // Store refresh token
  store: async (userId, tokenHash, expiresAt) => {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, tokenHash, expiresAt]
    );
    
    return result.rows[0];
  },

  // Find valid refresh token
  findValid: async (tokenHash) => {
    const result = await query(
      `SELECT rt.*, u.id as user_id, u.email, u.role, u.status
       FROM refresh_tokens rt
       INNER JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 
         AND rt.expires_at > NOW() 
         AND rt.is_revoked = FALSE
         AND u.status = 'active'`,
      [tokenHash]
    );
    
    return result.rows[0];
  },

  // Revoke token
  revoke: async (tokenHash) => {
    const result = await query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE, revoked_at = NOW()
       WHERE token_hash = $1
       RETURNING id`,
      [tokenHash]
    );
    
    return result.rows[0];
  },

  // Clean up expired tokens
  cleanupExpired: async () => {
    const result = await query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < NOW() OR is_revoked = TRUE`
    );
    
    return result.rowCount;
  },

  // Revoke all user tokens (for logout all devices)
  revokeAllForUser: async (userId) => {
    const result = await query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE, revoked_at = NOW()
       WHERE user_id = $1 AND is_revoked = FALSE
       RETURNING id`,
      [userId]
    );
    
    return result.rows;
  },

  // Revoke all user tokens
  revokeAllForUser: async (userId) => {
    const result = await query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE, revoked_at = NOW()
       WHERE user_id = $1 AND is_revoked = FALSE
       RETURNING id`,
      [userId]
    );
    
    return result.rows;
  },

  // Clean expired tokens
  cleanExpired: async () => {
    const result = await query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < NOW() OR (is_revoked = TRUE AND revoked_at < NOW() - INTERVAL '7 days')
       RETURNING id`
    );
    
    return result.rows.length;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  userService,
  accountService,
  csmAssignmentService,
  impersonationService,
  auditService,
  tokenService
};
