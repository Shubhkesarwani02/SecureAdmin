const { Pool } = require('pg');
require('dotenv').config();

// Use direct PostgreSQL connection for schema changes
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function applySchemaFix() {
  try {
    console.log('🔧 Applying schema fix for CSM role...\n');
    
    // Drop existing constraint
    console.log('📝 Dropping existing role constraint...');
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    console.log('✅ Existing constraint dropped');
    
    // Add new constraint with CSM role
    console.log('📝 Adding new constraint with CSM role...');
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('superadmin', 'admin', 'csm', 'user'));
    `);
    console.log('✅ New constraint added with CSM support');
    
    // Update existing CSM users
    console.log('📝 Updating CSM test users to correct role...');
    const result = await pool.query(`
      UPDATE users SET role = 'csm' 
      WHERE email IN ('csm1@framtt.com', 'csm2@framtt.com')
      RETURNING email, full_name, role;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Updated CSM users:');
      result.rows.forEach(user => {
        console.log(`   • ${user.full_name} (${user.email}) → ${user.role}`);
      });
    } else {
      console.log('⚠️  No CSM users found to update');
    }
    
    console.log('\n🎉 Schema fix applied successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error applying schema fix:', error.message);
    return false;
  }
}

async function verifyRoleHierarchy() {
  try {
    console.log('\n🔍 FINAL ROLE HIERARCHY VERIFICATION');
    console.log('====================================\n');
    
    const result = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        array_agg(email ORDER BY email) as users,
        array_agg(full_name ORDER BY email) as names
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
    
    const roleDefinitions = {
      superadmin: {
        description: 'Full system control, manage all users, data',
        accessScope: 'Access to all data and users across system',
        features: 'Manage users, roles, impersonate any user, see all accounts and reports'
      },
      admin: {
        description: 'Manage all customer accounts, users and data',
        accessScope: 'Access to all customer accounts and data',
        features: 'Invite users, assign roles, impersonate any CSM or users under them'
      },
      csm: {
        description: 'Handles assigned customer accounts only',
        accessScope: 'Access restricted to assigned customer accounts',
        features: 'View/manage only assigned accounts and related data'
      },
      user: {
        description: 'Regular end user of the platform',
        accessScope: 'Access to their own data only',
        features: 'Normal usage features, no impersonation or admin privileges'
      }
    };
    
    result.rows.forEach(row => {
      const def = roleDefinitions[row.role];
      console.log(`🔑 ${row.role.toUpperCase()} (${row.count} users)`);
      console.log(`   Users: ${row.users.join(', ')}`);
      console.log(`   Names: ${row.names.join(', ')}`);
      if (def) {
        console.log(`   Description: ${def.description}`);
        console.log(`   Access: ${def.accessScope}`);
        console.log(`   Features: ${def.features}`);
      }
      console.log('   ---\n');
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error verifying hierarchy:', error.message);
    return [];
  }
}

async function generateTestCredentials() {
  try {
    console.log('🔐 COMPLETE TEST USER CREDENTIALS');
    console.log('=================================\n');
    
    const result = await pool.query(`
      SELECT email, full_name, role, department, status, created_at
      FROM users 
      WHERE email LIKE '%@framtt.com'
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'csm' THEN 3 
          WHEN 'user' THEN 4 
        END, email
    `);
    
    const credentials = {
      'superadmin@framtt.com': 'SuperAdmin123!',
      'admin@framtt.com': 'Admin123!',
      'csm1@framtt.com': 'CSM123!',
      'csm2@framtt.com': 'CSM123!',
      'user1@framtt.com': 'User123!',
      'user2@framtt.com': 'User123!'
    };
    
    result.rows.forEach(user => {
      const password = credentials[user.email] || 'Check setup script for password';
      console.log(`👤 ${user.role.toUpperCase()}: ${user.full_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.created_at.toISOString().split('T')[0]}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error generating credentials:', error.message);
  }
}

async function validateRoleConstraint() {
  try {
    console.log('\n🧪 TESTING ROLE CONSTRAINT');
    console.log('==========================\n');
    
    const testRoles = ['superadmin', 'admin', 'csm', 'user'];
    
    for (const role of testRoles) {
      try {
        // Try to insert a test user with this role
        await pool.query(`
          INSERT INTO users (email, password_hash, full_name, role, status)
          VALUES ($1, 'test', 'Test User', $2, 'active')
        `, [`test-${role}@test.com`, role]);
        
        console.log(`✅ ${role.toUpperCase()} role: VALID`);
        
        // Clean up test user
        await pool.query('DELETE FROM users WHERE email = $1', [`test-${role}@test.com`]);
        
      } catch (error) {
        console.log(`❌ ${role.toUpperCase()} role: INVALID - ${error.message}`);
      }
    }
    
    // Test invalid role
    try {
      await pool.query(`
        INSERT INTO users (email, password_hash, full_name, role, status)
        VALUES ('test-invalid@test.com', 'test', 'Test User', 'invalid_role', 'active')
      `);
      console.log('❌ SECURITY ISSUE: Invalid role was accepted!');
    } catch (error) {
      console.log('✅ SECURITY: Invalid roles properly rejected');
    }
    
  } catch (error) {
    console.error('❌ Error validating constraint:', error.message);
  }
}

async function generateImplementationGuide() {
  console.log('\n📚 IMPLEMENTATION GUIDE');
  console.log('=======================\n');
  
  console.log('🔹 AUTHENTICATION TESTING:');
  console.log('   Use the credentials above to test login for each role');
  console.log('   Verify JWT tokens contain correct role information');
  console.log('');
  
  console.log('🔹 AUTHORIZATION TESTING:');
  console.log('   • Superadmin: Should access all features and data');
  console.log('   • Admin: Should manage users and impersonate CSM/Users');
  console.log('   • CSM: Should only access assigned customer accounts');
  console.log('   • User: Should only access their own data');
  console.log('');
  
  console.log('🔹 IMPERSONATION TESTING:');
  console.log('   • Superadmin → Can impersonate anyone');
  console.log('   • Admin → Can impersonate CSM and Users');
  console.log('   • CSM → Cannot impersonate anyone');
  console.log('   • User → Cannot impersonate anyone');
  console.log('');
  
  console.log('🔹 NEXT STEPS:');
  console.log('   1. Test API endpoints with each role');
  console.log('   2. Verify middleware enforces role-based access');
  console.log('   3. Test impersonation functionality');
  console.log('   4. Create CSM assignment records for testing');
  console.log('   5. Validate UI shows/hides features per role');
}

async function main() {
  console.log('🚀 Framtt Role Hierarchy - Schema Fix & Verification\n');
  console.log('===================================================\n');
  
  try {
    // Apply schema fix
    const schemaFixed = await applySchemaFix();
    
    if (schemaFixed) {
      // Verify the complete hierarchy
      await verifyRoleHierarchy();
      
      // Test role constraints
      await validateRoleConstraint();
      
      // Generate credentials
      await generateTestCredentials();
      
      // Implementation guide
      await generateImplementationGuide();
      
      console.log('\n🎉 Role hierarchy setup and verification completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

main();
