const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE_URL = 'http://localhost:5000';

async function checkSpecificUsers() {
  console.log('🔍 CHECKING SPECIFIC USER ISSUES');
  console.log('=' .repeat(60));
  console.log('Investigating: csm2@framtt.com and user2@framtt.com\n');

  const problematicUsers = [
    { email: 'csm2@framtt.com', password: 'CSM123!' },
    { email: 'user2@framtt.com', password: 'User123!' }
  ];

  // First, check if these users exist in the database
  console.log('📊 DATABASE VERIFICATION:');
  console.log('-'.repeat(40));

  for (const testUser of problematicUsers) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', testUser.email)
        .single();

      if (error) {
        console.log(`❌ ${testUser.email}: NOT FOUND IN DATABASE`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ ${testUser.email}: FOUND IN DATABASE`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Is Active: ${user.is_active}`);
        console.log(`   Password Hash: ${user.password_hash ? 'EXISTS' : 'MISSING'}`);
        console.log(`   Hash Preview: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`   Last Login: ${user.last_login || 'Never'}`);
        console.log(`   Created: ${user.created_at}`);
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${testUser.email}: DATABASE ERROR`);
      console.log(`   Error: ${err.message}`);
    }
  }

  // Now test login API calls
  console.log('🚀 API LOGIN TESTING:');
  console.log('-'.repeat(40));

  for (const testUser of problematicUsers) {
    try {
      console.log(`Testing login for: ${testUser.email}`);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ${testUser.email}: LOGIN SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Token: ${response.data.token ? 'Received' : 'Missing'}`);
      console.log(`   User ID: ${response.data.user?.id || 'N/A'}`);
      console.log(`   User Role: ${response.data.user?.role || 'N/A'}`);

    } catch (error) {
      console.log(`❌ ${testUser.email}: LOGIN FAILED`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   Error: API server not running (connection refused)`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');
  }

  // Check for common issues
  console.log('🔧 COMMON ISSUES CHECK:');
  console.log('-'.repeat(40));
  
  // Check if API server is running
  try {
    const healthCheck = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ API Server: RUNNING');
    console.log(`   Health check status: ${healthCheck.status}`);
  } catch (error) {
    console.log('❌ API Server: NOT RUNNING or UNREACHABLE');
    console.log('   Please ensure the backend server is started');
  }

  // Check all users with similar emails to see pattern
  console.log('\n📋 ALL CSM AND USER ACCOUNTS:');
  console.log('-'.repeat(40));
  
  try {
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, email, role, name, status, is_active, password_hash, last_login')
      .or('role.eq.csm,role.eq.user')
      .order('email');

    if (error) {
      console.log('❌ Could not fetch users:', error.message);
    } else {
      allUsers.forEach(user => {
        const hasPassword = user.password_hash ? '✅' : '❌';
        const isActive = user.is_active !== false ? '✅' : '❌';
        console.log(`${hasPassword} ${user.email} (${user.role}) - Active: ${isActive} - Login: ${user.last_login || 'Never'}`);
      });
    }
  } catch (err) {
    console.log('❌ Error fetching users:', err.message);
  }

  // Suggestions
  console.log('\n💡 TROUBLESHOOTING SUGGESTIONS:');
  console.log('-'.repeat(40));
  console.log('1. Verify the email addresses are exactly correct (no typos)');
  console.log('2. Check if the API server is running on localhost:5000');
  console.log('3. Verify the password hashes exist in the database');
  console.log('4. Check if the accounts are active (is_active = true)');
  console.log('5. Try running the password fix script if hashes are missing');
  console.log('6. Check the backend logs for detailed error messages');
}

// Run the check
checkSpecificUsers().catch(console.error);
