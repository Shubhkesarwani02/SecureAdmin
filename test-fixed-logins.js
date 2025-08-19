const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function testFixedLogins() {
  console.log('🧪 TESTING FIXED LOGIN CREDENTIALS');
  console.log('=' .repeat(60));
  
  const testUsers = [
    { email: 'csm2@framtt.com', password: 'CSM123!' },
    { email: 'user2@framtt.com', password: 'User123!' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n🔐 Testing login: ${testUser.email}`);
    console.log('-'.repeat(50));
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ LOGIN SUCCESS!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Token: ${response.data.token ? 'Received ✅' : 'Missing ❌'}`);
      console.log(`   User ID: ${response.data.user?.id || 'N/A'}`);
      console.log(`   User Role: ${response.data.user?.role || 'N/A'}`);
      console.log(`   User Name: ${response.data.user?.name || response.data.user?.full_name || 'N/A'}`);
      
      if (response.data.token) {
        console.log(`   Token Preview: ${response.data.token.substring(0, 20)}...`);
      }

    } catch (error) {
      console.log(`❌ LOGIN FAILED`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
        console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   Error: API server not running (connection refused)`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎯 SUMMARY');
  console.log('=' .repeat(60));
  console.log('The password hashes have been fixed in the database.');
  console.log('Both users should now be able to log in with their credentials:');
  console.log('');
  console.log('✅ csm2@framtt.com / CSM123!');
  console.log('✅ user2@framtt.com / User123!');
  console.log('');
  console.log('If login still fails, check:');
  console.log('1. API server is running on localhost:5000');
  console.log('2. Database connection is working');
  console.log('3. No additional validation rules blocking these accounts');
}

// Run the test
testFixedLogins().catch(console.error);
