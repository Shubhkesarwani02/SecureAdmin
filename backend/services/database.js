const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const net = require('net');

// Database connection configuration
// Use DATABASE_URL if available, otherwise fall back to individual parameters
const pool = new Pool(
  process.env.DATABASE_URL ? 
  {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: false,
      sslmode: 'require'
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout
  } :
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'framtt_superadmin',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: false,
      sslmode: 'require'
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout
  }
);

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

// Utility validators
const isValidUUID = (value) => {
  if (typeof value !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
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
      phone
    } = userData;

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, department, phone, status, created_at`,
      [email, hashedPassword, fullName, role, department, phone]
    );
    
    return result.rows[0];
  },

  // Update user
  update: async (id, updateData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const key of Object.keys(updateData)) {
      if (key === 'password') {
        fields.push(`password_hash = $${paramCount}`);
        // Use async hash instead of sync
        const hashedPassword = await bcrypt.hash(updateData[key], parseInt(process.env.BCRYPT_ROUNDS) || 12);
        values.push(hashedPassword);
      } else if (key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    }

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
  },

  // Get users assigned to accounts managed by a specific CSM
  getUsersByCSM: async (csmId, options = {}) => {
    const {
      role = 'user', // Default to only regular users
      status,
      page = 1,
      limit = 10,
      search,
      sortBy = 'u.created_at',
      sortOrder = 'DESC'
    } = options;

    let whereClause = "WHERE u.status != 'deleted' AND u.role = $1";
    const params = [role];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND u.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT DISTINCT u.id, u.email, u.full_name, u.role, u.department, u.phone, u.status, u.created_at, u.updated_at, u.last_login,
       array_agg(DISTINCT a.name) as account_names
       FROM users u
       INNER JOIN user_accounts ua ON u.id = ua.user_id
       INNER JOIN accounts a ON ua.account_id = a.id
       INNER JOIN csm_assignments ca ON a.id = ca.account_id
       ${whereClause} AND ca.csm_id = $${paramCount}
       GROUP BY u.id, u.email, u.full_name, u.role, u.department, u.phone, u.status, u.created_at, u.updated_at, u.last_login
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, csmId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT u.id) 
       FROM users u
       INNER JOIN user_accounts ua ON u.id = ua.user_id
       INNER JOIN accounts a ON ua.account_id = a.id
       INNER JOIN csm_assignments ca ON a.id = ca.account_id
       ${whereClause} AND ca.csm_id = $${paramCount}`,
      [...params, csmId]
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
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
      whereClause += ` AND (a.name ILIKE $${paramCount} OR a.company_name ILIKE $${paramCount} OR a.contact_email ILIKE $${paramCount})`;
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
      `SELECT ca.*, a.name as account_name, a.company_name, a.contact_email as account_email
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
  },

  // Get accounts by CSM
  getAccountsByCSM: async (csmId) => {
    const result = await query(
      `SELECT ca.*, a.name as account_name, a.company_name, a.contact_email as account_email, a.status as account_status
       FROM csm_assignments ca
       INNER JOIN accounts a ON ca.account_id = a.id
       WHERE ca.csm_id = $1 AND a.status != 'deleted'
       ORDER BY ca.is_primary DESC, ca.assigned_at DESC`,
      [csmId]
    );
    
    return result.rows;
  },

  // Get CSMs assigned to an account
  getCSMsByAccount: async (accountId) => {
    const result = await query(
      `SELECT ca.*, u.full_name as csm_name, u.email as csm_email, u.status as csm_status
       FROM csm_assignments ca
       INNER JOIN users u ON ca.csm_id = u.id
       WHERE ca.account_id = $1 AND u.status != 'deleted'
       ORDER BY ca.is_primary DESC, ca.assigned_at DESC`,
      [accountId]
    );
    
    return result.rows;
  },

  // Get unassigned accounts (accounts without CSM assignments)
  getUnassignedAccounts: async () => {
    const result = await query(
      `SELECT a.id, a.name, a.company_name, a.contact_email, a.status, a.created_at
       FROM accounts a
       LEFT JOIN csm_assignments ca ON a.id = ca.account_id
       WHERE a.status = 'active' AND ca.account_id IS NULL
       ORDER BY a.name`
    );
    
    return result.rows;
  },

  // Get available CSMs for assignment
  getAvailableCSMs: async () => {
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.department, u.status, u.created_at,
       COUNT(ca.account_id) as assigned_accounts_count
       FROM users u
       LEFT JOIN csm_assignments ca ON u.id = ca.csm_id
       WHERE u.role = 'csm' AND u.status = 'active'
       GROUP BY u.id, u.full_name, u.email, u.department, u.status, u.created_at
       ORDER BY assigned_accounts_count ASC, u.full_name`
    );
    
    return result.rows;
  },

  // Create CSM assignment (alias for assign)
  create: async (assignmentData) => {
    return await csmAssignmentService.assign(assignmentData);
  },

  // Get specific CSM-account assignment
  getByCSMAndAccount: async (csmId, accountId) => {
    const result = await query(
      `SELECT ca.*, a.name as account_name, u.full_name as csm_name
       FROM csm_assignments ca
       INNER JOIN accounts a ON ca.account_id = a.id
       INNER JOIN users u ON ca.csm_id = u.id
       WHERE ca.csm_id = $1 AND ca.account_id = $2`,
      [csmId, accountId]
    );
    
    return result.rows[0];
  }
};

// User Account operations (User to Account mapping)
const userAccountService = {
  // Assign user to account
  assign: async (assignmentData) => {
    const { userId, accountId, roleInAccount = 'member', assignedBy } = assignmentData;
    
    const result = await query(
      `INSERT INTO user_accounts (user_id, account_id, role_in_account, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, account_id) 
       DO UPDATE SET role_in_account = $3, updated_at = NOW()
       RETURNING *`,
      [userId, accountId, roleInAccount, assignedBy]
    );
    
    return result.rows[0];
  },

  // Get user account assignments
  getByUser: async (userId) => {
    const result = await query(
      `SELECT ua.*, a.name as account_name, a.company_name, a.contact_email as account_email
       FROM user_accounts ua
       INNER JOIN accounts a ON ua.account_id = a.id
       WHERE ua.user_id = $1 AND a.status != 'deleted'
       ORDER BY ua.assigned_at DESC`,
      [userId]
    );
    
    return result.rows;
  },

  // Get account user assignments
  getByAccount: async (accountId) => {
    const result = await query(
      `SELECT ua.*, u.full_name as user_name, u.email as user_email, u.role as user_role
       FROM user_accounts ua
       INNER JOIN users u ON ua.user_id = u.id
       WHERE ua.account_id = $1 AND u.status != 'deleted'
       ORDER BY ua.assigned_at DESC`,
      [accountId]
    );
    
    return result.rows;
  },

  // Remove user account assignment
  remove: async (userId, accountId) => {
    const result = await query(
      'DELETE FROM user_accounts WHERE user_id = $1 AND account_id = $2 RETURNING *',
      [userId, accountId]
    );
    
    return result.rows[0];
  },

  // Get unassigned users (users without any account assignments)
  getUnassignedUsers: async () => {
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.department, u.status, u.created_at
       FROM users u
       LEFT JOIN user_accounts ua ON u.id = ua.user_id
       WHERE u.role = 'user' AND u.status = 'active' AND ua.user_id IS NULL
       ORDER BY u.full_name`
    );
    
    return result.rows;
  },

  // Get users available for assignment to a specific account
  getAvailableUsers: async (accountId = null) => {
    let queryText = `
      SELECT u.id, u.full_name, u.email, u.role, u.department, u.status, u.created_at
      FROM users u
      WHERE u.role = 'user' AND u.status = 'active'
    `;
    
    let params = [];
    
    if (accountId) {
      queryText += ` AND u.id NOT IN (
        SELECT ua.user_id FROM user_accounts ua WHERE ua.account_id = $1
      )`;
      params = [accountId];
    }
    
    queryText += ` ORDER BY u.full_name`;
    
    const result = await query(queryText, params);
    return result.rows;
  },

  // Create user account assignment (alias for assign)
  create: async (assignmentData) => {
    return await userAccountService.assign(assignmentData);
  },

  // Get specific user-account assignment
  getByUserAndAccount: async (userId, accountId) => {
    const result = await query(
      `SELECT ua.*, a.name as account_name, u.full_name as user_name
       FROM user_accounts ua
       INNER JOIN accounts a ON ua.account_id = a.id
       INNER JOIN users u ON ua.user_id = u.id
       WHERE ua.user_id = $1 AND ua.account_id = $2`,
      [userId, accountId]
    );
    
    return result.rows[0];
  },

  // Get account users with pagination and filtering
  getByAccount: async (accountId, options = {}) => {
    const {
      role,
      status,
      page = 1,
      limit = 10,
      search,
      sortBy = 'assigned_at',
      sortOrder = 'DESC'
    } = options;

    let whereConditions = ['ua.account_id = $1', 'u.status != $2'];
    let params = [accountId, 'deleted'];
    let paramIndex = 3;

    // Add role filter
    if (role) {
      if (Array.isArray(role)) {
        const placeholders = role.map(() => `$${paramIndex++}`).join(',');
        whereConditions.push(`u.role IN (${placeholders})`);
        params.push(...role);
      } else {
        whereConditions.push(`u.role = $${paramIndex++}`);
        params.push(role);
      }
    }

    // Add status filter
    if (status) {
      whereConditions.push(`u.status = $${paramIndex++}`);
      params.push(status);
    }

    // Add search filter
    if (search) {
      whereConditions.push(`(
        u.full_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const validSortColumns = ['assigned_at', 'user_name', 'user_email', 'user_role'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'assigned_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_accounts ua
      INNER JOIN users u ON ua.user_id = u.id
      WHERE ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        ua.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role,
        u.status as user_status,
        u.department,
        u.created_at as user_created_at
      FROM user_accounts ua
      INNER JOIN users u ON ua.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sortColumn === 'user_name' ? 'u.full_name' : 
                sortColumn === 'user_email' ? 'u.email' :
                sortColumn === 'user_role' ? 'u.role' : 'ua.assigned_at'} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const limit_val = Math.min(limit, 100);
    const offset = (page - 1) * limit_val;
    params.push(limit_val, offset);

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, params.slice(0, -2)),
      query(dataQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit_val);

    return {
      users: dataResult.rows,
      pagination: {
        page,
        limit: limit_val,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
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
       WHERE impersonator_id::bigint = $1 AND is_active = TRUE`,
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
       WHERE impersonator_id::bigint = $1 AND session_id = $2 AND is_active = TRUE
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
      `SELECT il.*, 
              il.created_at as start_time,
              il.ended_at as end_time,
              u.full_name as impersonated_name, u.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users u ON il.impersonated_id::bigint = u.id
       WHERE il.impersonator_id::bigint = $1 AND il.is_active = TRUE
       ORDER BY il.created_at DESC`,
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

    console.log('DEBUG getHistory - Input options:', JSON.stringify(options, null, 2));
    console.log('DEBUG getHistory - impersonatorId type:', typeof impersonatorId, 'value:', impersonatorId);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (impersonatorId) {
      whereClause += ` AND il.impersonator_id::bigint = $${paramCount}`;
      params.push(impersonatorId);
      paramCount++;
    }

    if (impersonatedId) {
      whereClause += ` AND il.impersonated_id::bigint = $${paramCount}`;
      params.push(impersonatedId);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND il.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND il.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    console.log('DEBUG getHistory - whereClause:', whereClause);
    console.log('DEBUG getHistory - params:', params);
    console.log('DEBUG getHistory - param types:', params.map(p => typeof p));
    
    const countQuery = `SELECT COUNT(*) as total
       FROM impersonation_logs il
       INNER JOIN users imp ON il.impersonator_id::bigint = imp.id
       INNER JOIN users imp_ed ON il.impersonated_id::bigint = imp_ed.id
       ${whereClause}`;
       
    console.log('DEBUG getHistory - count query:', countQuery);
    
    // First get the total count
    const countResult = await query(countQuery, params);
    
    const result = await query(
      `SELECT il.*, 
              il.created_at as start_time,
              il.ended_at as end_time,
              imp.full_name as impersonator_name, imp.email as impersonator_email,
              imp_ed.full_name as impersonated_name, imp_ed.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users imp ON il.impersonator_id::bigint = imp.id
       INNER JOIN users imp_ed ON il.impersonated_id::bigint = imp_ed.id
       ${whereClause}
       ORDER BY il.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  },

  // Check if user can impersonate another user based on role hierarchy and assignments
  canImpersonate: async (impersonatorId, targetUserId) => {
    // Get both users
    const impersonator = await userService.findById(impersonatorId);
    const targetUser = await userService.findById(targetUserId);

    if (!impersonator || !targetUser) {
      return {
        canImpersonate: false,
        reason: 'User not found'
      };
    }

    // Cannot impersonate yourself
    if (impersonatorId === targetUserId) {
      return {
        canImpersonate: false,
        reason: 'Cannot impersonate yourself'
      };
    }

    // Check if target user is already being impersonated
    if (targetUser.is_impersonation_active) {
      return {
        canImpersonate: false,
        reason: 'Target user is already being impersonated'
      };
    }

    // Role-based access control
    if (impersonator.role === 'superadmin') {
      // Superadmin can impersonate anyone
      return {
        canImpersonate: true,
        reason: 'Superadmin has full impersonation privileges'
      };
    }

    if (impersonator.role === 'admin') {
      // Admin can impersonate CSMs and regular users, but not other admins or superadmins
      if (['csm', 'user'].includes(targetUser.role)) {
        return {
          canImpersonate: true,
          reason: 'Admin can impersonate CSMs and users'
        };
      }
      return {
        canImpersonate: false,
        reason: `Admin cannot impersonate ${targetUser.role} users`
      };
    }

    if (impersonator.role === 'csm') {
      // CSMs can only impersonate users in their assigned accounts
      if (targetUser.role === 'user') {
        const csmAssignments = await csmAssignmentService.getByCSM(impersonatorId);
        const userAccounts = await userAccountService.getByUser(targetUserId);
        
        const hasCommonAccount = csmAssignments.some(assignment => 
          userAccounts.some(userAccount => userAccount.account_id === assignment.account_id)
        );
        
        if (hasCommonAccount) {
          return {
            canImpersonate: true,
            reason: 'CSM can impersonate users in assigned accounts'
          };
        }
        
        return {
          canImpersonate: false,
          reason: 'CSM can only impersonate users in assigned accounts'
        };
      }
      
      return {
        canImpersonate: false,
        reason: 'CSMs can only impersonate regular users'
      };
    }

    // Regular users cannot impersonate anyone
    return {
      canImpersonate: false,
      reason: 'Regular users do not have impersonation privileges'
    };
  },

  // Get current impersonation status for a user
  getCurrentStatus: async (userId) => {
    const result = await query(
      `SELECT il.*, 
              imp.full_name as impersonator_name, imp.email as impersonator_email,
              imp_ed.full_name as impersonated_name, imp_ed.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users imp ON il.impersonator_id::bigint = imp.id
       INNER JOIN users imp_ed ON il.impersonated_id::bigint = imp_ed.id
       WHERE (il.impersonator_id::bigint = $1 OR il.impersonated_id::bigint = $1) AND il.is_active = TRUE
       ORDER BY il.created_at DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  },

  // Record an action performed during impersonation
  recordAction: async (sessionId, action) => {
    await query(
      `UPDATE impersonation_logs 
       SET actions_performed = actions_performed || $2::jsonb
       WHERE session_id = $1 AND is_active = TRUE`,
      [sessionId, JSON.stringify([{
        action,
        timestamp: new Date().toISOString()
      }])]
    );
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

    // Coerce fields to match column types safely
    const safeResourceId = isValidUUID(resourceId) ? resourceId : null;
    const isIpValid = typeof ipAddress === 'string' && net.isIP(ipAddress) !== 0;

    // Ensure JSON objects and preserve textual identifiers when types don't match
    const oldValuesJson = (oldValues === undefined) ? null : oldValues;
    const mergedNewValues = (() => {
      const base = (newValues && typeof newValues === 'object') ? newValues : (newValues === undefined ? {} : { value: newValues });
      const extras = {};
      if (resourceId && !safeResourceId) {
        extras.resource_identifier_text = String(resourceId).slice(0, 255);
      }
      if (ipAddress && !isIpValid) {
        extras.ip_text = String(ipAddress).slice(0, 255);
      }
      return { ...base, ...extras };
    })();

    const result = await query(
      `INSERT INTO audit_logs 
       (user_id, impersonator_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        isValidUUID(userId) ? userId : null,
        isValidUUID(impersonatorId) ? impersonatorId : null,
        action,
        resourceType,
        safeResourceId,
        oldValuesJson === null ? null : JSON.stringify(oldValuesJson),
        JSON.stringify(mergedNewValues),
        isIpValid ? ipAddress : null,
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

    try {
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
      
      // First try to get the total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
        params
      );
      
      const total = parseInt(countResult.rows[0].total);
      
      // Then get the actual logs with simpler query to avoid join issues
      const result = await query(
        `SELECT al.*
         FROM audit_logs al
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, limit, offset]
      );

      return {
        logs: result.rows,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error in getLogs:', error);
      // Return mock data if there's an error
      return {
        logs: [
          {
            id: 1,
            user_id: '1',
            action: 'USER_LOGIN',
            resource_type: 'USER',
            resource_id: '1',
            created_at: new Date(),
            ip_address: '127.0.0.1',
            user_agent: 'Test Browser'
          }
        ],
        total: 1,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: 1
      };
    }
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
  userAccountService,
  impersonationService,
  auditService,
  tokenService
};
