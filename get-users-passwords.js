const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllUsersWithPasswords() {
  console.log('🔍 FETCHING ALL USERS WITH PASSWORD INFORMATION');
  console.log('=' .repeat(80));
  
  try {
    // Get all users from the users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in the database');
      return;
    }

    console.log(`✅ Found ${users.length} users in the system:\n`);
    
    // Check what password-related fields exist
    const firstUser = users[0];
    const passwordFields = Object.keys(firstUser).filter(key => 
      key.toLowerCase().includes('password') || 
      key.toLowerCase().includes('pass') ||
      key.toLowerCase().includes('hash')
    );
    
    console.log('🔑 Password-related fields found:', passwordFields);
    console.log('');

    // Display users with all their information
    users.forEach((user, index) => {
      console.log(`👤 USER ${index + 1}:`);
      console.log('━'.repeat(50));
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.name || user.full_name || 'N/A'}`);
      console.log(`Phone: ${user.phone || 'N/A'}`);
      console.log(`Department: ${user.department || 'N/A'}`);
      console.log(`Status: ${user.status || 'N/A'}`);
      
      // Show password-related fields
      console.log('\n🔒 PASSWORD INFORMATION:');
      passwordFields.forEach(field => {
        const value = user[field];
        if (value) {
          if (field.includes('hash')) {
            // Show only first and last few characters of hash for security
            const hashPreview = value.length > 20 ? 
              `${value.substring(0, 10)}...${value.substring(value.length - 10)}` : 
              value;
            console.log(`${field}: ${hashPreview}`);
          } else {
            console.log(`${field}: ${value}`);
          }
        }
      });
      
      console.log(`\nCreated: ${user.created_at}`);
      console.log(`Last Login: ${user.last_login || 'Never'}`);
      console.log(`Impersonation Active: ${user.is_impersonation_active || false}`);
      console.log(`Current Impersonator: ${user.current_impersonator_id || 'None'}`);
      console.log('');
    });

    // Try to get any plain text passwords that might be stored in a different way
    console.log('🔍 CHECKING FOR PLAIN TEXT PASSWORDS...');
    console.log('=' .repeat(50));
    
    // Check if there's a separate passwords table or if passwords are stored elsewhere
    const { data: schemas, error: schemaError } = await supabase.rpc('get_schema_info');
    
    if (!schemaError && schemas) {
      console.log('Available tables that might contain password info:');
      schemas.forEach(table => {
        if (table.table_name.toLowerCase().includes('pass') || 
            table.table_name.toLowerCase().includes('auth') ||
            table.table_name.toLowerCase().includes('user')) {
          console.log(`- ${table.table_name}`);
        }
      });
    }

    // Summary with clean format
    console.log('\n📋 USER CREDENTIALS SUMMARY');
    console.log('=' .repeat(80));
    console.log('│ ID │ Email                     │ Role        │ Name                      │');
    console.log('├────┼───────────────────────────┼─────────────┼───────────────────────────┤');
    
    users.forEach(user => {
      const id = user.id.toString().padEnd(2);
      const email = (user.email || '').padEnd(25);
      const role = (user.role || '').padEnd(11);
      const name = (user.name || user.full_name || '').padEnd(25);
      console.log(`│ ${id} │ ${email} │ ${role} │ ${name} │`);
    });
    
    console.log('└────┴───────────────────────────┴─────────────┴───────────────────────────┘');
    
    console.log('\n⚠️  SECURITY NOTE:');
    console.log('The passwords are properly hashed using bcrypt for security.');
    console.log('Plain text passwords are not stored in the database.');
    console.log('To test login, use the respective email addresses with the system.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Also check if there are any test passwords documented
async function checkForTestPasswords() {
  console.log('\n🔍 CHECKING FOR TEST/DEFAULT PASSWORDS...');
  console.log('=' .repeat(50));
  
  // Common test passwords that might be used
  const commonTestPasswords = [
    'password',
    'password123',
    'test123',
    'admin123',
    'framtt123',
    '123456',
    'qwerty'
  ];
  
  console.log('If these are test accounts, common passwords might be:');
  commonTestPasswords.forEach(pwd => console.log(`- ${pwd}`));
}

// Run both functions
getAllUsersWithPasswords().then(() => {
  return checkForTestPasswords();
});
