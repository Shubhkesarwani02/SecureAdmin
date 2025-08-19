const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
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
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `
    });
    
    if (error) {
      // Try alternative method
      const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      return tableError?.code !== 'PGRST116'; // Table not found error
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error checking if users table exists:', error.message);
    return false;
  }
}

async function clearExistingTestUsers() {
  try {
    console.log('🧹 Clearing existing test users...');
    
    const testEmails = testUsers.map(user => user.email);
    
    const { data, error } = await supabase
      .from('users')
      .delete()
      .in('email', testEmails);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log(`✅ Cleared existing test users`);
  } catch (error) {
    console.error('❌ Error clearing test users:', error.message);
    // Don't throw, just continue
  }
}

async function createTestUsers() {
  try {
    console.log('👥 Creating test users for role hierarchy...\n');
    
    for (const user of testUsers) {
      console.log(`📝 Creating ${user.role}: ${user.email}`);
      
      const hashedPassword = await hashPassword(user.password);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: user.email,
          password_hash: hashedPassword,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          department: user.department,
          status: user.status,
          bio: user.bio,
          permissions: user.permissions
        }]);
      
      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
        continue;
      }
      
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
    
    const { data, error } = await supabase
      .from('users')
      .select('role, email, full_name, status, created_at')
      .order('created_at');
    
    if (error) {
      throw error;
    }
    
    // Group by role
    const roleGroups = data.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});
    
    console.log('📊 ROLE HIERARCHY VERIFICATION');
    console.log('================================\n');
    
    const roleOrder = ['superadmin', 'admin', 'csm', 'user'];
    
    roleOrder.forEach(role => {
      if (roleGroups[role]) {
        const users = roleGroups[role];
        const roleInfo = roleHierarchy[role];
        
        console.log(`🔑 ROLE: ${role.toUpperCase()}`);
        console.log(`   Count: ${users.length} users`);
        console.log(`   Users: ${users.map(u => u.email).join(', ')}`);
        console.log(`   Description: ${roleInfo.description}`);
        console.log(`   Access Scope: ${roleInfo.accessScope}`);
        console.log(`   Features: ${roleInfo.featuresEnabled}`);
        console.log('   ---\n');
      }
    });
    
    return data;
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
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Users table does not exist. Please run the database schema setup first.');
      console.log('   Run: node setup-database.js or apply the SQL schema files.');
      return;
    } else if (testError) {
      throw testError;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Clear existing test users
    await clearExistingTestUsers();
    
    // Create test users
    await createTestUsers();
    
    // Verify the hierarchy
    await verifyRoleHierarchy();
    
    // Display credentials
    await displayLoginCredentials();
    
    console.log('\n🎉 Role hierarchy setup completed successfully!');
    console.log('\n📝 NEXT STEPS:');
    console.log('==============');
    console.log('1. Test login with each role using the credentials above');
    console.log('2. Verify role-based access control in your application');
    console.log('3. Test impersonation features for superadmin and admin roles');
    console.log('4. Verify CSM assignment functionality');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupRoleHierarchy();
