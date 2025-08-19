const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function debugAccountAccess() {
  console.log('🔍 Debugging Account Access Issues...\n');
  
  try {
    // Login as different users and check what they get
    const users = [
      { email: 'superadmin@framtt.com', password: 'SuperAdmin123!', role: 'superadmin' },
      { email: 'admin@framtt.com', password: 'Admin123!', role: 'admin' },
      { email: 'csm1@framtt.com', password: 'CSM123!', role: 'csm' }
    ];

    for (const user of users) {
      console.log(`\n🔑 Testing ${user.role} access:`);
      
      try {
        // Login
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        const token = loginResponse.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get accounts
        console.log(`Requesting accounts for ${user.role}...`);
        const accountsResponse = await axios.get(`${API_BASE_URL}/api/accounts`, { headers });
        
        console.log(`Response status: ${accountsResponse.status}`);
        console.log(`Response data:`, JSON.stringify(accountsResponse.data, null, 2));
        
        // Get users
        console.log(`\nRequesting users for ${user.role}...`);
        try {
          const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, { headers });
          console.log(`Users response status: ${usersResponse.status}`);
          console.log(`Users response data:`, JSON.stringify(usersResponse.data, null, 2));
        } catch (userError) {
          console.log(`Users request failed: ${userError.response?.status} - ${userError.response?.data?.message}`);
        }
        
      } catch (error) {
        console.log(`❌ ${user.role} test failed:`, error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugAccountAccess().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
