// =============================================
// SIMPLIFIED DATABASE SERVICE
// Matches exact schema specification requirements
// =============================================

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

// =============================================
// USER SERVICE (SIMPLIFIED)
// =============================================
const userService = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create new user
  create: async (userData) => {
    const { email, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, hashedPassword, role]
    );
    
    return result.rows[0];
  },

  // Update user
  update: async (id, userData) => {
    const { email, role } = userData;
    
    const result = await query(
      `UPDATE users 
       SET email = $1, role = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [email, role, id]
    );
    
    return result.rows[0];
  },

  // Delete user
  delete: async (id) => {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get all users
  getAll: async () => {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  // Get users by role
  getByRole: async (role) => {
    const result = await query(
      'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );
    return result.rows;
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

// =============================================
// ACCOUNT SERVICE (SIMPLIFIED)
// =============================================
const accountService = {
  // Find account by ID
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create new account
  create: async (accountData) => {
    const { name } = accountData;
    
    const result = await query(
      `INSERT INTO accounts (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );
    
    return result.rows[0];
  },

  // Update account
  update: async (id, accountData) => {
    const { name } = accountData;
    
    const result = await query(
      `UPDATE accounts 
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [name, id]
    );
    
    return result.rows[0];
  },

  // Delete account
  delete: async (id) => {
    const result = await query(
      'DELETE FROM accounts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get all accounts
  getAll: async () => {
    const result = await query(
      'SELECT * FROM accounts ORDER BY created_at DESC'
    );
    return result.rows;
  }
};

// =============================================
// CSM ASSIGNMENT SERVICE (SIMPLIFIED)
// =============================================
const csmAssignmentService = {
  // Assign CSM to account
  assign: async (assignmentData) => {
    const { csmId, accountId } = assignmentData;
    
    const result = await query(
      `INSERT INTO csm_assignments (csm_id, account_id)
       VALUES ($1, $2)
       ON CONFLICT (csm_id, account_id) DO NOTHING
       RETURNING *`,
      [csmId, accountId]
    );
    
    return result.rows[0];
  },

  // Get CSM assignments by CSM
  getByCSM: async (csmId) => {
    const result = await query(
      `SELECT ca.*, a.name as account_name
       FROM csm_assignments ca
       INNER JOIN accounts a ON ca.account_id = a.id
       WHERE ca.csm_id = $1
       ORDER BY a.name`,
      [csmId]
    );
    
    return result.rows;
  },

  // Get CSM assignments by Account
  getByAccount: async (accountId) => {
    const result = await query(
      `SELECT ca.*, u.email as csm_email, u.role as csm_role
       FROM csm_assignments ca
       INNER JOIN users u ON ca.csm_id = u.id
       WHERE ca.account_id = $1
       ORDER BY u.email`,
      [accountId]
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

  // Get all CSM assignments
  getAll: async () => {
    const result = await query(
      `SELECT ca.*, u.email as csm_email, a.name as account_name
       FROM csm_assignments ca
       INNER JOIN users u ON ca.csm_id = u.id
       INNER JOIN accounts a ON ca.account_id = a.id
       ORDER BY u.email, a.name`
    );
    
    return result.rows;
  }
};

// =============================================
// USER ACCOUNT SERVICE (SIMPLIFIED)
// =============================================
const userAccountService = {
  // Assign user to account
  assign: async (assignmentData) => {
    const { userId, accountId } = assignmentData;
    
    const result = await query(
      `INSERT INTO user_accounts (user_id, account_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, account_id) DO NOTHING
       RETURNING *`,
      [userId, accountId]
    );
    
    return result.rows[0];
  },

  // Get user accounts by user
  getByUser: async (userId) => {
    const result = await query(
      `SELECT ua.*, a.name as account_name
       FROM user_accounts ua
       INNER JOIN accounts a ON ua.account_id = a.id
       WHERE ua.user_id = $1
       ORDER BY a.name`,
      [userId]
    );
    
    return result.rows;
  },

  // Get user accounts by account
  getByAccount: async (accountId) => {
    const result = await query(
      `SELECT ua.*, u.email as user_email, u.role as user_role
       FROM user_accounts ua
       INNER JOIN users u ON ua.user_id = u.id
       WHERE ua.account_id = $1
       ORDER BY u.email`,
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

  // Get all user account assignments
  getAll: async () => {
    const result = await query(
      `SELECT ua.*, u.email as user_email, a.name as account_name
       FROM user_accounts ua
       INNER JOIN users u ON ua.user_id = u.id
       INNER JOIN accounts a ON ua.account_id = a.id
       ORDER BY u.email, a.name`
    );
    
    return result.rows;
  }
};

// =============================================
// IMPERSONATION SERVICE (SIMPLIFIED)
// =============================================
const impersonationService = {
  // Start impersonation session
  start: async (impersonationData) => {
    const { impersonatorId, impersonatedId, reason } = impersonationData;
    
    const result = await query(
      `INSERT INTO impersonation_logs (impersonator_id, impersonated_id, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [impersonatorId, impersonatedId, reason]
    );
    
    return result.rows[0];
  },

  // End impersonation session
  end: async (logId) => {
    const result = await query(
      `UPDATE impersonation_logs 
       SET end_time = NOW()
       WHERE id = $1 AND end_time IS NULL
       RETURNING *`,
      [logId]
    );
    
    return result.rows[0];
  },

  // Get active impersonation sessions
  getActive: async () => {
    const result = await query(
      `SELECT il.*, 
              u1.email as impersonator_email,
              u2.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users u1 ON il.impersonator_id = u1.id
       INNER JOIN users u2 ON il.impersonated_id = u2.id
       WHERE il.end_time IS NULL
       ORDER BY il.start_time DESC`
    );
    
    return result.rows;
  },

  // Get impersonation history
  getHistory: async (limit = 100) => {
    const result = await query(
      `SELECT il.*, 
              u1.email as impersonator_email,
              u2.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users u1 ON il.impersonator_id = u1.id
       INNER JOIN users u2 ON il.impersonated_id = u2.id
       ORDER BY il.start_time DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  },

  // Get impersonation logs by impersonator
  getByImpersonator: async (impersonatorId) => {
    const result = await query(
      `SELECT il.*, 
              u.email as impersonated_email
       FROM impersonation_logs il
       INNER JOIN users u ON il.impersonated_id = u.id
       WHERE il.impersonator_id = $1
       ORDER BY il.start_time DESC`,
      [impersonatorId]
    );
    
    return result.rows;
  },

  // Get impersonation logs by impersonated user
  getByImpersonated: async (impersonatedId) => {
    const result = await query(
      `SELECT il.*, 
              u.email as impersonator_email
       FROM impersonation_logs il
       INNER JOIN users u ON il.impersonator_id = u.id
       WHERE il.impersonated_id = $1
       ORDER BY il.start_time DESC`,
      [impersonatedId]
    );
    
    return result.rows;
  }
};

// =============================================
// EXPORT ALL SERVICES
// =============================================
module.exports = {
  pool,
  testConnection,
  query,
  userService,
  accountService,
  csmAssignmentService,
  userAccountService,
  impersonationService
};
