const axios = require('axios');

async function testImpersonationOnly() {
  console.log('🔍 Testing impersonation functionality...\n');
  
  const BASE_URL = 'http://localhost:5000/api';
  
  // Login as superadmin
  const superadminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'superadmin@framtt.com',
    password: 'SuperAdmin123!'
  });
  
  const superadminToken = superadminLogin.data.data.token;
  const superadminId = superadminLogin.data.data.user.id;
  console.log('✅ Superadmin login successful');
  
  // Login as CSM to get CSM ID
  const csmLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'csm1@framtt.com',
    password: 'CSM123!'
  });
  
  const csmId = csmLogin.data.data.user.id;
  console.log('✅ CSM login successful, ID:', csmId);
  
  // Try impersonation
  console.log('\n🎭 Testing impersonation start...');
  try {
    const impersonateResponse = await axios.post(`${BASE_URL}/auth/impersonate/start`, {
      targetUserId: parseInt(csmId)
    }, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log('✅ Impersonation successful!');
    console.log('Response:', JSON.stringify(impersonateResponse.data, null, 2));
    
    if (impersonateResponse.data.data?.impersonationToken) {
      console.log('\n🛑 Testing impersonation stop...');
      const stopResponse = await axios.post(`${BASE_URL}/auth/impersonate/stop`, {}, {
        headers: { Authorization: `Bearer ${impersonateResponse.data.data.impersonationToken}` }
      });
      
      console.log('✅ Impersonation stop successful!');
      console.log('Stop response:', JSON.stringify(stopResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Impersonation failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Details:', error.response?.data?.details);
    console.error('Stack:', error.response?.data?.stack);
  }
}

testImpersonationOnly().catch(console.error);
