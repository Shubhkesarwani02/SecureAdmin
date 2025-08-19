const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAccountServiceLogic() {
  console.log('🔍 Testing Account Service Logic Directly...\n');
  
  try {
    // Test CSM assignments query directly
    console.log('📋 Testing CSM account query directly:');
    const csmId = 26; // csm1@framtt.com
    
    const { data: csmAccounts, error: csmError } = await supabase
      .from('accounts')
      .select(`
        *,
        csm_assignments!inner(
          is_primary,
          assigned_at,
          notes
        )
      `)
      .eq('csm_assignments.csm_id', csmId);
    
    if (csmError) {
      console.log('❌ CSM query error:', csmError);
    } else {
      console.log('✅ CSM accounts query successful:');
      console.log(`Found ${csmAccounts.length} accounts for CSM ${csmId}:`);
      csmAccounts.forEach(account => {
        console.log(`  - ${account.name} (ID: ${account.id})`);
      });
    }

    // Test admin query (all accounts)
    console.log('\n📋 Testing admin account query (all accounts):');
    const { data: allAccounts, error: allError } = await supabase
      .from('accounts')
      .select('*');
    
    if (allError) {
      console.log('❌ Admin query error:', allError);
    } else {
      console.log('✅ Admin accounts query successful:');
      console.log(`Found ${allAccounts.length} total accounts:`);
      allAccounts.forEach(account => {
        console.log(`  - ${account.name} (ID: ${account.id})`);
      });
    }

    // Test user accounts query
    console.log('\n📋 Testing user account assignments:');
    const userId = 28; // user1@framtt.com
    
    const { data: userAccounts, error: userError } = await supabase
      .from('user_accounts')
      .select(`
        *,
        accounts!inner(
          id,
          name,
          contact_email
        )
      `)
      .eq('user_id', userId);
    
    if (userError) {
      console.log('❌ User accounts query error:', userError);
    } else {
      console.log('✅ User accounts query successful:');
      console.log(`Found ${userAccounts.length} account assignments for user ${userId}:`);
      userAccounts.forEach(assignment => {
        console.log(`  - ${assignment.accounts.name} (ID: ${assignment.accounts.id})`);
      });
    }

    // Check if the issue is with the data structure
    console.log('\n📋 Checking CSM assignments table structure:');
    const { data: assignments, error: assignError } = await supabase
      .from('csm_assignments')
      .select('*');
    
    if (assignError) {
      console.log('❌ CSM assignments query error:', assignError);
    } else {
      console.log('✅ CSM assignments found:');
      assignments.forEach(assignment => {
        console.log(`  CSM ${assignment.csm_id} → Account ${assignment.account_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAccountServiceLogic().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
