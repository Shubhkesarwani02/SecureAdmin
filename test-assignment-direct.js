const axios = require('axios');

async function testAssignmentAPIDirect() {
  console.log('🔍 Testing assignment API directly...\n');
  
  const BASE_URL = 'http://localhost:5000/api';
  
  // Login as admin
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@framtt.com',
    password: 'Admin123!'
  });
  
  const adminToken = adminLogin.data.data.token;
  console.log('✅ Admin login successful');
  
  // Get admin user info to understand the ID format
  console.log('\nAdmin user info:');
  console.log('ID:', adminLogin.data.data.user.id, '(type:', typeof adminLogin.data.data.user.id, ')');
  
  // Get CSM user
  const csmLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'csm1@framtt.com',
    password: 'CSM123!'
  });
  
  console.log('\nCSM user info:');
  console.log('ID:', csmLogin.data.data.user.id, '(type:', typeof csmLogin.data.data.user.id, ')');
  
  // Get accounts
  const accountsResponse = await axios.get(`${BASE_URL}/accounts`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  const firstAccount = accountsResponse.data.data.accounts[0];
  console.log('\nFirst account info:');
  console.log('ID:', firstAccount.id, '(type:', typeof firstAccount.id, ')');
  console.log('Name:', firstAccount.name);
  
  // Try assignment with original string values (no conversion)
  console.log('\n🔧 Testing CSM assignment with original values...');
  try {
    const assignResponse = await axios.post(`${BASE_URL}/roles/assign`, {
      userId: csmLogin.data.data.user.id, // Keep as string
      accountId: firstAccount.id,
      action: 'assign'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ CSM assignment successful!');
    console.log('Response:', assignResponse.data);
    
  } catch (error) {
    console.error('❌ CSM assignment failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Details:', error.response?.data?.details);
    
    // Let's try a different approach - maybe there's an issue with the role assignment
    // Let's test if the CSM user has the correct role
    console.log('\n🔧 Checking if user role is actually CSM...');
    
    try {
      const userCheckResponse = await axios.get(`${BASE_URL}/roles/${csmLogin.data.data.user.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('User role check response:', userCheckResponse.data);
    } catch (roleError) {
      console.error('Failed to check user role:', roleError.response?.data || roleError.message);
    }
  }
}

testAssignmentAPIDirect().catch(console.error);
