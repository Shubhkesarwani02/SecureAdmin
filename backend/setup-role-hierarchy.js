const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Role hierarchy as per the attached document
const roleHierarchy = {
  superadmin: {
    description: 'Full system control, manage all users, data',
    accessScope: 'Access to all data and users across system',
    featuresEnabled: 'Manage users, roles, impersonate any user, see all accounts and reports'
  },
  admin: {
    description: 'Manage all customer accounts, users and data',
    accessScope: 'Access to all customer accounts and data',
    featuresEnabled: 'Invite users, assign roles, impersonate any CSM or users under them'
  },
  csm: {
    description: 'Handles assigned customer accounts only',
    accessScope: 'Access restricted to assigned customer accounts',
    featuresEnabled: 'View/manage only assigned accounts and related data'
  },
  user: {
    description: 'Regular end user of the platform',
    accessScope: 'Access to their own data only',
    featuresEnabled: 'Normal usage features, no impersonation or admin privileges'
  }
};

// Test users for each role
const testUsers = [
  {
    email: 'superadmin@framtt.com',
    password: 'SuperAdmin123!',
    full_name: 'Super Administrator',
    phone: '+1-555-0001',
    role: 'superadmin',
    department: 'System Administration',
    status: 'active',
    bio: 'System superadmin with full access to all platform features and data.',
    permissions: ['all', 'user_management', 'role_management', 'impersonation', 'system_monitoring']
  },
  {
    email: 'admin@framtt.com',
    password: 'Admin123!',
    full_name: 'Platform Administrator',
    phone: '+1-555-0002',
    role: 'admin',
    department: 'Operations',
    status: 'active',
    bio: 'Platform administrator managing customer accounts and user operations.',
    permissions: ['user_management', 'customer_management', 'impersonation_csm_user', 'reports']
  },
  {
    email: 'csm1@framtt.com',
    password: 'CSM123!',
    full_name: 'Customer Success Manager One',
    phone: '+1-555-0003',
    role: 'csm',
    department: 'Customer Success',
    status: 'active',
    bio: 'Customer Success Manager handling assigned customer accounts.',
    permissions: ['account_management', 'customer_support', 'assigned_accounts_only']
  },
  {
    email: 'csm2@framtt.com',
    password: 'CSM123!',
    full_name: 'Customer Success Manager Two',
    phone: '+1-555-0004',
    role: 'csm',
    department: 'Customer Success',
    status: 'active',
    bio: 'Customer Success Manager handling assigned customer accounts.',
    permissions: ['account_management', 'customer_support', 'assigned_accounts_only']
  },
  {
    email: 'user1@framtt.com',
    password: 'User123!',
    full_name: 'Test User One',
    phone: '+1-555-0005',
    role: 'user',
    department: 'General',
    status: 'active',
    bio: 'Regular platform user for testing purposes.',
    permissions: ['basic_access', 'profile_management']
  },
  {
    email: 'user2@framtt.com',
    password: 'User123!',
    full_name: 'Test User Two',
    phone: '+1-555-0006',
    role: 'user',
    department: 'General',
    status: 'active',
    bio: 'Regular platform user for testing purposes.',
    permissions: ['basic_access', 'profile_management']
  }
];

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function checkTableExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('❌ Error checking if users table exists:', error.message);
    return false;
  }
}

async function createUsersTable() {
  try {
    console.log('📊 Creating users table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
        department VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
        avatar TEXT,
        bio TEXT,
        permissions JSONB DEFAULT '[]',
        preferences JSONB DEFAULT '{
          "emailNotifications": true,
          "pushNotifications": false,
          "weeklyReports": true,
          "marketingEmails": false,
          "twoFactorAuth": false,
          "sessionTimeout": "8",
          "language": "en",
          "timezone": "America/New_York",
          "theme": "light"
        }',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      );
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);');
    
    console.log('✅ Users table created successfully');
  } catch (error) {
    console.error('❌ Error creating users table:', error.message);
    throw error;
  }
}

async function clearExistingTestUsers() {
  try {
    console.log('🧹 Clearing existing test users...');
    
    const testEmails = testUsers.map(user => user.email);
    const placeholders = testEmails.map((_, index) => `$${index + 1}`).join(', ');
    
    const result = await pool.query(
      `DELETE FROM users WHERE email IN (${placeholders})`,
      testEmails
    );
    
    console.log(`✅ Cleared ${result.rowCount} existing test users`);
  } catch (error) {
    console.error('❌ Error clearing test users:', error.message);
    throw error;
  }
}

async function createTestUsers() {
  try {
    console.log('👥 Creating test users for role hierarchy...\n');
    
    for (const user of testUsers) {
      console.log(`📝 Creating ${user.role}: ${user.email}`);
      
      const hashedPassword = await hashPassword(user.password);
      
      await pool.query(`
        INSERT INTO users (
          email, password_hash, full_name, phone, role, department, 
          status, bio, permissions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        user.email,
        hashedPassword,
        user.full_name,
        user.phone,
        user.role,
        user.department,
        user.status,
        user.bio,
        JSON.stringify(user.permissions)
      ]);
      
      console.log(`   ✅ Created: ${user.full_name} (${user.role})`);
    }
    
    console.log('\n✅ All test users created successfully!');
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    throw error;
  }
}

async function verifyRoleHierarchy() {
  try {
    console.log('\n🔍 Verifying role hierarchy...\n');
    
    const result = await pool.query(`
      SELECT role, COUNT(*) as count, 
             array_agg(email ORDER BY email) as users
      FROM users 
      GROUP BY role 
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'csm' THEN 3 
          WHEN 'user' THEN 4 
        END
    `);
    
    console.log('📊 ROLE HIERARCHY VERIFICATION');
    console.log('================================\n');
    
    result.rows.forEach(row => {
      const roleInfo = roleHierarchy[row.role];
      console.log(`🔑 ROLE: ${row.role.toUpperCase()}`);
      console.log(`   Count: ${row.count} users`);
      console.log(`   Users: ${row.users.join(', ')}`);
      console.log(`   Description: ${roleInfo.description}`);
      console.log(`   Access Scope: ${roleInfo.accessScope}`);
      console.log(`   Features: ${roleInfo.featuresEnabled}`);
      console.log('   ---\n');
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error verifying role hierarchy:', error.message);
    throw error;
  }
}

async function displayLoginCredentials() {
  try {
    console.log('🔐 TEST USER LOGIN CREDENTIALS');
    console.log('==============================\n');
    
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Name: ${user.full_name}`);
      console.log('   ---');
    });
    
    console.log('\n📋 ROLE CAPABILITIES SUMMARY:');
    console.log('=============================\n');
    
    Object.entries(roleHierarchy).forEach(([role, info]) => {
      console.log(`${role.toUpperCase()}:`);
      console.log(`   • ${info.description}`);
      console.log(`   • ${info.accessScope}`);
      console.log(`   • ${info.featuresEnabled}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error displaying credentials:', error.message);
  }
}

async function setupRoleHierarchy() {
  try {
    console.log('🚀 Setting up Framtt Role Hierarchy\n');
    console.log('====================================\n');
    
    // Check if table exists, create if not
    const tableExists = await checkTableExists();
    if (!tableExists) {
      await createUsersTable();
    } else {
      console.log('✅ Users table already exists');
    }
    
    // Clear existing test users
    await clearExistingTestUsers();
    
    // Create test users
    await createTestUsers();
    
    // Verify the hierarchy
    await verifyRoleHierarchy();
    
    // Display credentials
    await displayLoginCredentials();
    
    console.log('\n🎉 Role hierarchy setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupRoleHierarchy();
