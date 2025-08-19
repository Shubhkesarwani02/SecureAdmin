const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPasswordHashes() {
  console.log('🔐 PASSWORD HASH VERIFICATION');
  console.log('=' .repeat(60));
  
  const usersToCheck = [
    { email: 'csm2@framtt.com', expectedPassword: 'CSM123!' },
    { email: 'user2@framtt.com', expectedPassword: 'User123!' }
  ];

  for (const testUser of usersToCheck) {
    console.log(`\n🔍 Checking: ${testUser.email}`);
    console.log('-'.repeat(40));
    
    try {
      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name')
        .eq('email', testUser.email)
        .single();

      if (error) {
        console.log(`❌ User not found: ${error.message}`);
        continue;
      }

      console.log(`✅ User found: ${user.full_name || 'No name'}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Hash: ${user.password_hash.substring(0, 30)}...`);
      
      // Test if the expected password matches the hash
      if (user.password_hash) {
        const isMatch = await bcrypt.compare(testUser.expectedPassword, user.password_hash);
        console.log(`🧪 Password "${testUser.expectedPassword}" matches hash: ${isMatch ? '✅ YES' : '❌ NO'}`);
        
        if (!isMatch) {
          console.log('⚠️  The stored hash does NOT match the expected password!');
          
          // Try some common variations
          const variations = [
            'CSM123!',
            'csm123!',
            'CSM123',
            'User123!',
            'user123!',
            'User123',
            'password123',
            'test123',
            'framtt123'
          ];
          
          console.log('🔍 Testing common password variations...');
          for (const variation of variations) {
            const varMatch = await bcrypt.compare(variation, user.password_hash);
            if (varMatch) {
              console.log(`✅ FOUND MATCH: "${variation}"`);
              break;
            }
          }
        }
      } else {
        console.log('❌ No password hash found for this user');
      }
      
    } catch (err) {
      console.log(`❌ Error checking ${testUser.email}: ${err.message}`);
    }
  }

  // Let's also check what hashes should look like for the expected passwords
  console.log('\n🔧 GENERATING CORRECT HASHES:');
  console.log('-'.repeat(40));
  
  const passwords = ['CSM123!', 'User123!'];
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`Password: "${password}"`);
    console.log(`Hash: ${hash}`);
    console.log('');
  }
}

async function fixPasswordHashes() {
  console.log('\n🔧 FIXING PASSWORD HASHES:');
  console.log('-'.repeat(40));
  
  const fixes = [
    { email: 'csm2@framtt.com', password: 'CSM123!' },
    { email: 'user2@framtt.com', password: 'User123!' }
  ];

  for (const fix of fixes) {
    try {
      const newHash = await bcrypt.hash(fix.password, 12);
      
      const { data, error } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('email', fix.email)
        .select();

      if (error) {
        console.log(`❌ Failed to update ${fix.email}: ${error.message}`);
      } else {
        console.log(`✅ Updated password hash for ${fix.email}`);
      }
    } catch (err) {
      console.log(`❌ Error updating ${fix.email}: ${err.message}`);
    }
  }
}

// Run verification first, then ask user if they want to fix
verifyPasswordHashes().then(() => {
  console.log('\n❓ Do you want to fix the password hashes? (This script will automatically fix them)');
  console.log('   If yes, run: node fix-problem-passwords.js');
});
