const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllUsers() {
  console.log('🔍 FETCHING ALL USERS AND THEIR INFORMATION');
  console.log('=' .repeat(60));
  
  try {
    // Get all users from the users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in the database');
      return;
    }

    console.log(`✅ Found ${users.length} users in the system:\n`);
    
    // Display users in a formatted table
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                     ALL USERS INFORMATION                                      │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ ID   │ Email                        │ Password         │ Role        │ Name                   │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');

    users.forEach((user, index) => {
      const id = (user.id || 'N/A').toString().padEnd(4);
      const email = (user.email || 'N/A').padEnd(28);
      const password = (user.password || 'N/A').padEnd(16);
      const role = (user.role || 'N/A').padEnd(11);
      const name = (user.name || user.full_name || 'N/A').padEnd(22);
      
      console.log(`│ ${id} │ ${email} │ ${password} │ ${role} │ ${name} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘');
    
    // Also display detailed information
    console.log('\n📋 DETAILED USER INFORMATION:');
    console.log('=' .repeat(60));
    
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.name || user.full_name || 'Not specified'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log(`   Active: ${user.is_active !== false ? 'Yes' : 'No'}`);
      
      // Show any additional fields
      const excludeFields = ['id', 'email', 'password', 'role', 'name', 'full_name', 'created_at', 'updated_at', 'is_active'];
      const additionalFields = Object.keys(user).filter(key => !excludeFields.includes(key));
      
      if (additionalFields.length > 0) {
        console.log('   Additional fields:');
        additionalFields.forEach(field => {
          console.log(`     ${field}: ${user[field]}`);
        });
      }
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`Total Users: ${users.length}`);
    
    const roleCount = {};
    users.forEach(user => {
      const role = user.role || 'Unspecified';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    console.log('Users by Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
getAllUsers();
