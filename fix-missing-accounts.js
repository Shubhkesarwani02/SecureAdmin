const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingAccounts() {
  console.log('🔍 Checking and creating missing CSM and User accounts...\n');
  
  try {
    // Check existing users
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .order('id');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log('📋 Existing users:');
    existingUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.role} (ID: ${user.id})`);
    });
    
    // Check for missing roles
    const existingRoles = existingUsers.map(u => u.role);
    const requiredRoles = ['superadmin', 'admin', 'csm', 'user'];
    const missingRoles = requiredRoles.filter(role => !existingRoles.includes(role));
    
    console.log(`\n🔍 Missing roles: ${missingRoles.join(', ')}`);
    
    // Create missing accounts
    const newUsers = [];
    
    if (missingRoles.includes('csm')) {
      const hashedPassword = await bcrypt.hash('CSMPassword123!', 12);
      newUsers.push({
        email: 'csm@framtt.com',
        password_hash: hashedPassword,
        role: 'csm',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (missingRoles.includes('user')) {
      const hashedPassword = await bcrypt.hash('UserPassword123!', 12);
      newUsers.push({
        email: 'user@framtt.com',
        password_hash: hashedPassword,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (newUsers.length > 0) {
      console.log(`\n📝 Creating ${newUsers.length} missing accounts...`);
      
      const { data: createdUsers, error: createError } = await supabase
        .from('users')
        .insert(newUsers)
        .select();
      
      if (createError) {
        throw createError;
      }
      
      console.log('✅ Successfully created accounts:');
      createdUsers.forEach(user => {
        console.log(`  - ${user.email}: ${user.role} (ID: ${user.id})`);
      });
    } else {
      console.log('\n✅ All required role accounts already exist');
    }
    
    // Create sample accounts for CSM assignment testing
    console.log('\n🏢 Ensuring sample accounts exist...');
    
    const { data: existingAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name')
      .limit(3);
    
    if (accountsError) {
      console.log('⚠️  Could not check accounts table:', accountsError.message);
    } else if (existingAccounts.length === 0) {
      const sampleAccounts = [
        {
          name: 'Account Alpha',
          contact_email: 'alpha@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Account Beta',
          contact_email: 'beta@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { data: createdAccounts, error: createAccountsError } = await supabase
        .from('accounts')
        .insert(sampleAccounts)
        .select();
      
      if (createAccountsError) {
        console.log('⚠️  Could not create sample accounts:', createAccountsError.message);
      } else {
        console.log('✅ Created sample accounts:');
        createdAccounts.forEach(account => {
          console.log(`  - ${account.name} (ID: ${account.id})`);
        });
      }
    } else {
      console.log(`✅ Found ${existingAccounts.length} existing accounts`);
    }
    
    console.log('\n✅ Account setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating missing accounts:', error.message);
  }
}

// Run the fix
createMissingAccounts().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
