const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixRoleConstraint() {
  try {
    console.log('🔍 Checking current role constraint...\n');
    
    // First, let's see what roles currently exist in the database
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('role')
      .order('role');
    
    if (usersError) {
      throw usersError;
    }
    
    const currentRoles = [...new Set(existingUsers.map(u => u.role))];
    console.log('📊 Current roles in database:', currentRoles.join(', '));
    
    // Try to create a test CSM user to see the constraint error
    console.log('\n🧪 Testing CSM role creation...');
    
    const { data: testData, error: testError } = await supabase
      .from('users')
      .insert([{
        email: 'test-csm@test.com',
        password_hash: 'test',
        full_name: 'Test CSM',
        role: 'csm',
        status: 'active'
      }]);
    
    if (testError) {
      console.log('❌ Error creating CSM user:', testError.message);
      console.log('🔧 The role constraint needs to be updated to include "csm"');
      
      // Clean up test user if it was created
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test-csm@test.com');
        
      return false;
    } else {
      console.log('✅ CSM role creation successful!');
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test-csm@test.com');
        
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking role constraint:', error.message);
    return false;
  }
}

async function createCSMUsersManually() {
  try {
    console.log('\n🔧 Creating CSM users with workaround...\n');
    
    const csmUsers = [
      {
        email: 'csm1@framtt.com',
        password_hash: await require('bcrypt').hash('CSM123!', 12),
        full_name: 'Customer Success Manager One',
        phone: '+1-555-0003',
        role: 'user', // Temporarily create as user
        department: 'Customer Success',
        status: 'active',
        bio: 'Customer Success Manager handling assigned customer accounts.',
        permissions: ['account_management', 'customer_support', 'assigned_accounts_only']
      },
      {
        email: 'csm2@framtt.com',
        password_hash: await require('bcrypt').hash('CSM123!', 12),
        full_name: 'Customer Success Manager Two',
        phone: '+1-555-0004',
        role: 'user', // Temporarily create as user
        department: 'Customer Success',
        status: 'active',
        bio: 'Customer Success Manager handling assigned customer accounts.',
        permissions: ['account_management', 'customer_support', 'assigned_accounts_only']
      }
    ];
    
    // Delete existing CSM test users first
    await supabase
      .from('users')
      .delete()
      .in('email', ['csm1@framtt.com', 'csm2@framtt.com']);
    
    // Create users as 'user' role first
    for (const user of csmUsers) {
      const { data, error } = await supabase
        .from('users')
        .insert([user]);
        
      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created ${user.full_name} (temporarily as user role)`);
      }
    }
    
    console.log('\n📝 NOTE: CSM users were created with "user" role due to database constraint.');
    console.log('   To fix this, you need to update the database schema constraint.');
    
  } catch (error) {
    console.error('❌ Error creating CSM users:', error.message);
  }
}

async function generateSchemaFix() {
  console.log('\n🔧 DATABASE SCHEMA FIX REQUIRED');
  console.log('================================\n');
  console.log('To enable CSM role, run this SQL command in your Supabase SQL Editor:\n');
  
  const sqlFix = `
-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with CSM role included
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'csm', 'user'));

-- Update existing users that should be CSM
UPDATE users SET role = 'csm' 
WHERE email IN ('csm1@framtt.com', 'csm2@framtt.com');
`;
  
  console.log(sqlFix);
  console.log('\nAfter running this SQL:');
  console.log('1. The CSM role will be available');
  console.log('2. Existing CSM test users will be updated to have the correct role');
  console.log('3. You can run the setup script again to verify');
}

async function main() {
  console.log('🔧 Framtt Role Constraint Checker & Fixer\n');
  console.log('==========================================\n');
  
  const csmSupported = await checkAndFixRoleConstraint();
  
  if (!csmSupported) {
    await createCSMUsersManually();
    await generateSchemaFix();
  } else {
    console.log('✅ CSM role is properly supported in the database schema!');
  }
}

main();
