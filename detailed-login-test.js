const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function detailedLoginTest() {
  console.log('🔍 DETAILED LOGIN RESPONSE CHECK');
  console.log('=' .repeat(60));
  
  const testUser = { email: 'csm2@framtt.com', password: 'CSM123!' };
  
  try {
    console.log(`Testing: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log('');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📋 FULL RESPONSE:');
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR DETAILS:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Headers:`, JSON.stringify(error.response.headers, null, 2));
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`Error:`, error.message);
    }
  }
}

detailedLoginTest().catch(console.error);
