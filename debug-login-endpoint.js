const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function debugLogin() {
  console.log('🔍 Debugging login endpoint...\n');
  
  try {
    // First test if server is reachable
    console.log('Testing server health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Server is running: ${healthResponse.status} - ${healthResponse.data.message}`);
    
    // Test login with detailed error handling
    console.log('\nTesting login endpoint...');
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'superadmin@framtt.com',
        password: 'SuperAdmin123!'
      });
      
      console.log('✅ Login Response:');
      console.log(`  Status: ${loginResponse.status}`);
      console.log(`  Headers: ${JSON.stringify(loginResponse.headers, null, 2)}`);
      console.log(`  Data: ${JSON.stringify(loginResponse.data, null, 2)}`);
      
    } catch (loginError) {
      console.log('❌ Login Error:');
      console.log(`  Status: ${loginError.response?.status}`);
      console.log(`  Status Text: ${loginError.response?.statusText}`);
      console.log(`  Headers: ${JSON.stringify(loginError.response?.headers, null, 2)}`);
      console.log(`  Data: ${JSON.stringify(loginError.response?.data, null, 2)}`);
      console.log(`  Error Message: ${loginError.message}`);
    }
    
    // Test if the endpoint exists
    console.log('\nTesting endpoint existence...');
    try {
      const endpointTest = await axios.get(`${API_BASE_URL}/api/auth/login`);
      console.log('GET request to login endpoint succeeded (unexpected)');
    } catch (getError) {
      if (getError.response?.status === 405) {
        console.log('✅ Login endpoint exists but only accepts POST (correct)');
      } else {
        console.log(`⚠️  GET to login endpoint: ${getError.response?.status} - ${getError.response?.statusText}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Server connection error:', error.message);
  }
}

// Run the debug
debugLogin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
