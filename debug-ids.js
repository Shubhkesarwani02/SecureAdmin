const axios = require('axios');

async function debugUserIds() {
  console.log('🔍 Debugging user IDs and account IDs...\n');
  
  const testUsers = {
    superadmin: { email: 'superadmin@framtt.com', password: 'SuperAdmin123!' },
    admin: { email: 'admin@framtt.com', password: 'Admin123!' },
    csm: { email: 'csm1@framtt.com', password: 'CSM123!' },
    user: { email: 'user1@framtt.com', password: 'User123!' }
  };
  
  const BASE_URL = 'http://localhost:5000/api';
  let tokens = {};
  let userIds = {};
  
  // Login and get user IDs
  for (const [role, credentials] of Object.entries(testUsers)) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
      tokens[role] = response.data.data.token;
      userIds[role] = response.data.data.user.id;
      
      console.log(`${role}:`);
      console.log(`  ID: ${userIds[role]} (type: ${typeof userIds[role]})`);
      console.log(`  Email: ${response.data.data.user.email}`);
      console.log(`  Role: ${response.data.data.user.role}`);
      console.log('');
    } catch (error) {
      console.error(`Failed to login ${role}:`, error.message);
    }
  }
  
  // Get accounts
  try {
    const accountsResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    
    console.log('Accounts:');
    if (accountsResponse.data.data && accountsResponse.data.data.length > 0) {
      accountsResponse.data.data.forEach((account, index) => {
        console.log(`  ${index + 1}. ID: ${account.id} (type: ${typeof account.id})`);
        console.log(`     Name: ${account.name}`);
      });
    } else {
      console.log('  No accounts found or different response structure');
      console.log('  Response structure:', JSON.stringify(accountsResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Failed to get accounts:', error.response?.data || error.message);
  }
}

debugUserIds();
