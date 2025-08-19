const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestData() {
  console.log('🔧 Setting up test data for authorization verification...\n');
  
  try {
    // Check current CSM assignments
    console.log('📋 Current CSM assignments:');
    const { data: csmAssignments, error: csmError } = await supabase
      .from('csm_assignments')
      .select('*');
    
    if (csmError) throw csmError;
    
    console.log(`Found ${csmAssignments.length} CSM assignments:`);
    csmAssignments.forEach(assignment => {
      console.log(`  CSM ${assignment.csm_id} → Account ${assignment.account_id}`);
    });

    // Check accounts
    console.log('\n🏢 Current accounts:');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(5);
    
    if (accountsError) throw accountsError;
    
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach(account => {
      console.log(`  ${account.id}: ${account.name} (${account.contact_email})`);
    });

    // Assign CSM to accounts if no assignments exist
    if (csmAssignments.length === 0 && accounts.length > 0) {
      console.log('\n📝 Creating CSM assignments for testing...');
      
      const testAssignments = [
        { csm_id: 26, account_id: accounts[0].id }, // csm1@framtt.com to first account
        { csm_id: 27, account_id: accounts[1]?.id || accounts[0].id } // csm2@framtt.com to second account (or first if only one exists)
      ].filter(assignment => assignment.account_id); // Remove any with undefined account_id

      for (const assignment of testAssignments) {
        const { error: assignError } = await supabase
          .from('csm_assignments')
          .insert({
            ...assignment,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (assignError) {
          console.log(`  ❌ Failed to assign CSM ${assignment.csm_id} to account ${assignment.account_id}: ${assignError.message}`);
        } else {
          console.log(`  ✅ Assigned CSM ${assignment.csm_id} to account ${assignment.account_id}`);
        }
      }
    }

    // Check user assignments
    console.log('\n👥 Current user assignments:');
    const { data: userAssignments, error: userError } = await supabase
      .from('user_accounts')
      .select('*');
    
    if (userError) throw userError;
    
    console.log(`Found ${userAssignments.length} user assignments:`);
    userAssignments.forEach(assignment => {
      console.log(`  User ${assignment.user_id} → Account ${assignment.account_id}`);
    });

    // Create user assignments if none exist
    if (userAssignments.length === 0 && accounts.length > 0) {
      console.log('\n📝 Creating user assignments for testing...');
      
      const testUserAssignments = [
        { user_id: 28, account_id: accounts[0].id }, // user1@framtt.com to first account
        { user_id: 29, account_id: accounts[1]?.id || accounts[0].id } // user2@framtt.com to second account
      ].filter(assignment => assignment.account_id);

      for (const assignment of testUserAssignments) {
        const { error: assignError } = await supabase
          .from('user_accounts')
          .insert({
            ...assignment,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (assignError) {
          console.log(`  ❌ Failed to assign user ${assignment.user_id} to account ${assignment.account_id}: ${assignError.message}`);
        } else {
          console.log(`  ✅ Assigned user ${assignment.user_id} to account ${assignment.account_id}`);
        }
      }
    }

    console.log('\n✅ Test data setup complete!');
    console.log('\nNow CSMs should see their assigned accounts, and users should see their assigned accounts.');

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
  }
}

// Run the setup
setupTestData().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
