const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPasswordHashing() {
  console.log('🔒 FIXING PASSWORD HASHING');
  console.log('=' .repeat(50));
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password_hash');
    
    if (error) throw error;
    
    console.log(`Found ${users.length} users to process...`);
    
    // Define proper passwords for each user
    const userPasswords = {
      'superadmin@framtt.com': 'SuperAdmin123!',
      'admin@framtt.com': 'Admin123!',
      'csm@framtt.com': 'Csm123!',
      'user@framtt.com': 'User123!'
    };
    
    let updatedCount = 0;
    
    for (const user of users) {
      const plainPassword = userPasswords[user.email];
      
      if (plainPassword) {
        // Check if password is already hashed
        const isAlreadyHashed = user.password_hash && user.password_hash.startsWith('$2b$');
        
        if (!isAlreadyHashed) {
          console.log(`  🔄 Hashing password for ${user.email}...`);
          
          // Hash the password
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
          
          // Update the user
          const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', user.id);
          
          if (updateError) {
            console.error(`    ❌ Error updating ${user.email}:`, updateError.message);
          } else {
            console.log(`    ✅ Updated ${user.email}`);
            updatedCount++;
          }
        } else {
          console.log(`  ✅ ${user.email} already has hashed password`);
        }
      } else {
        console.log(`  ⚠️  No password defined for ${user.email}`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✅ ${updatedCount} passwords updated with bcrypt hashing`);
    
    // Verify all passwords are now hashed
    console.log('\n🔍 VERIFICATION:');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('users')
      .select('email, password_hash');
    
    if (verifyError) throw verifyError;
    
    let hashedCount = 0;
    for (const user of updatedUsers) {
      if (user.password_hash && user.password_hash.startsWith('$2b$')) {
        hashedCount++;
        console.log(`  ✅ ${user.email}: Properly hashed`);
      } else {
        console.log(`  ❌ ${user.email}: Not hashed`);
      }
    }
    
    console.log(`\n🎉 RESULT: ${hashedCount}/${updatedUsers.length} passwords are properly hashed!`);
    
    // Test password verification
    console.log('\n🧪 TESTING PASSWORD VERIFICATION:');
    const testUser = updatedUsers.find(u => u.email === 'superadmin@framtt.com');
    if (testUser) {
      const isValid = await bcrypt.compare('SuperAdmin123!', testUser.password_hash);
      console.log(`  ✅ Superadmin password verification: ${isValid ? 'WORKING' : 'FAILED'}`);
    }

  } catch (error) {
    console.error('❌ Error fixing password hashing:', error.message);
  }
}

// Run the fix
fixPasswordHashing().then(() => {
  console.log('\n✅ Password hashing fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
