const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProblemPasswords() {
  console.log('🔧 FIXING PROBLEM USER PASSWORDS');
  console.log('=' .repeat(60));
  
  const fixes = [
    { email: 'csm2@framtt.com', password: 'CSM123!' },
    { email: 'user2@framtt.com', password: 'User123!' }
  ];

  for (const fix of fixes) {
    console.log(`\n🔄 Fixing: ${fix.email}`);
    console.log('-'.repeat(40));
    
    try {
      // Generate new hash
      console.log(`🔐 Generating hash for password: "${fix.password}"`);
      const newHash = await bcrypt.hash(fix.password, 12);
      console.log(`📝 New hash: ${newHash.substring(0, 30)}...`);
      
      // Update in database
      const { data, error } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('email', fix.email)
        .select('id, email, full_name');

      if (error) {
        console.log(`❌ Failed to update ${fix.email}: ${error.message}`);
      } else {
        console.log(`✅ Successfully updated password hash for ${fix.email}`);
        console.log(`   User: ${data[0]?.full_name || 'Unknown'}`);
      }
      
      // Verify the fix worked
      console.log('🧪 Verifying fix...');
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('email', fix.email)
        .single();
        
      if (!verifyError && verifyUser?.password_hash) {
        const isMatch = await bcrypt.compare(fix.password, verifyUser.password_hash);
        console.log(`✅ Verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (err) {
      console.log(`❌ Error fixing ${fix.email}: ${err.message}`);
    }
  }
  
  console.log('\n🎉 PASSWORD FIX COMPLETED!');
  console.log('=' .repeat(60));
  console.log('You can now try logging in with:');
  console.log('');
  console.log('📧 csm2@framtt.com');
  console.log('🔑 Password: CSM123!');
  console.log('');
  console.log('📧 user2@framtt.com');
  console.log('🔑 Password: User123!');
}

// Run the fix
fixProblemPasswords().catch(console.error);
