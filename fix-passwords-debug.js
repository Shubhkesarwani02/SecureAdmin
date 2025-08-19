const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPasswords() {
  console.log('🔍 Checking user passwords and updating them...\n');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, password_hash')
      .order('id');
    
    if (error) {
      throw error;
    }
    
    console.log('📋 Found users:');
    users.forEach(user => {
      const hasPassword = user.password_hash ? '✓' : '❌';
      console.log(`  ${user.id}: ${user.email} (${user.role}) - Password: ${hasPassword}`);
    });
    
    // Update passwords for all users with known passwords
    const passwordUpdates = [
      { email: 'superadmin@framtt.com', password: 'SuperAdmin123!' },
      { email: 'admin@framtt.com', password: 'Admin123!' },
      { email: 'csm1@framtt.com', password: 'CSM123!' },
      { email: 'csm2@framtt.com', password: 'CSM123!' },
      { email: 'user1@framtt.com', password: 'User123!' },
      { email: 'user2@framtt.com', password: 'User123!' },
      { email: 'john@framtt.com', password: 'SuperAdmin123!' },
      { email: 'sarah@framtt.com', password: 'Admin123!' }
    ];
    
    console.log('\n🔐 Updating passwords...');
    
    for (const update of passwordUpdates) {
      const user = users.find(u => u.email === update.email);
      if (user) {
        try {
          const hashedPassword = await bcrypt.hash(update.password, 12);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              password_hash: hashedPassword,
              updated_at: new Date().toISOString()
            })
            .eq('email', update.email);
          
          if (updateError) {
            console.log(`  ❌ Failed to update ${update.email}: ${updateError.message}`);
          } else {
            console.log(`  ✅ Updated password for ${update.email}`);
          }
        } catch (hashError) {
          console.log(`  ❌ Hash error for ${update.email}: ${hashError.message}`);
        }
      } else {
        console.log(`  ⚠️  User not found: ${update.email}`);
      }
    }
    
    console.log('\n✅ Password update complete!');
    console.log('\nTest credentials:');
    passwordUpdates.forEach(cred => {
      console.log(`  ${cred.email} : ${cred.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking passwords:', error.message);
  }
}

// Run the check
checkPasswords().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
