const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAllPasswords() {
  console.log('🔒 FIXING ALL USER PASSWORDS');
  console.log('=' .repeat(50));
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password_hash');
    
    if (error) throw error;
    
    console.log(`Found ${users.length} users to process...`);
    
    // Define proper passwords for ALL users
    const userPasswords = {
      'superadmin@framtt.com': 'SuperAdmin123!',
      'admin@framtt.com': 'Admin123!',
      'csm@framtt.com': 'Csm123!',
      'user@framtt.com': 'User123!',
      'john@framtt.com': 'John123!',
      'sarah@framtt.com': 'Sarah123!',
      'user2@framtt.com': 'User2123!',
      'csm1@framtt.com': 'Csm1123!',
      'user1@framtt.com': 'User1123!',
      'csm2@framtt.com': 'Csm2123!'
    };
    
    let updatedCount = 0;
    
    for (const user of users) {
      const plainPassword = userPasswords[user.email];
      
      if (plainPassword) {
        // Check if password is properly hashed
        const isProperlyHashed = user.password_hash && user.password_hash.startsWith('$2b$');
        
        if (!isProperlyHashed) {
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
            console.log(`    ✅ Updated ${user.email} with hashed password`);
            updatedCount++;
          }
        } else {
          console.log(`  ✅ ${user.email} already has properly hashed password`);
        }
      } else {
        console.log(`  ⚠️  No password defined for ${user.email} - creating default...`);
        
        // Create a default password for undefined users
        const defaultPassword = 'Default123!';
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`    ❌ Error updating ${user.email}:`, updateError.message);
        } else {
          console.log(`    ✅ Set default password for ${user.email}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✅ ${updatedCount} passwords updated with bcrypt hashing`);
    
    // Verify all passwords are now hashed
    console.log('\n🔍 FINAL VERIFICATION:');
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
    
    console.log(`\n🎉 FINAL RESULT: ${hashedCount}/${updatedUsers.length} passwords are properly hashed!`);
    
    if (hashedCount === updatedUsers.length) {
      console.log('🎊 ALL PASSWORDS ARE NOW PROPERLY HASHED WITH BCRYPT!');
    }
    
    // Test password verification for key users
    console.log('\n🧪 TESTING PASSWORD VERIFICATION:');
    const testUsers = ['superadmin@framtt.com', 'admin@framtt.com', 'csm1@framtt.com'];
    const testPasswords = {
      'superadmin@framtt.com': 'SuperAdmin123!',
      'admin@framtt.com': 'Admin123!',
      'csm1@framtt.com': 'Csm1123!'
    };
    
    for (const email of testUsers) {
      const user = updatedUsers.find(u => u.email === email);
      if (user && testPasswords[email]) {
        const isValid = await bcrypt.compare(testPasswords[email], user.password_hash);
        console.log(`  ✅ ${email}: ${isValid ? 'WORKING' : 'FAILED'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error fixing passwords:', error.message);
  }
}

// Run the fix
fixAllPasswords().then(() => {
  console.log('\n✅ All password hashing completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
