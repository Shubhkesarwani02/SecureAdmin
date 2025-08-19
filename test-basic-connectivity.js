const axios = require('axios');

async function testServerAndAuth() {
  console.log('🔍 Testing server connectivity and authentication...\n');
  
  try {
    // Test 1: Server health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is healthy:', healthResponse.data);
    
    // Test 2: Basic authentication test
    console.log('\n2. Testing superadmin authentication...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'superadmin@framtt.com',
      password: 'SuperAdmin123!'
    });
    
    console.log('✅ Superadmin login successful');
    
    if (loginResponse.data.data?.user) {
      console.log('   User:', loginResponse.data.data.user.email, '- Role:', loginResponse.data.data.user.role);
    }
    console.log('   Token received:', loginResponse.data.data?.token ? 'Yes' : 'No');
    
    const token = loginResponse.data.data?.token || loginResponse.data.data?.accessToken;
    
    // Test 3: Test authenticated endpoint
    console.log('\n3. Testing authenticated endpoint...');
    const usersResponse = await axios.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Users endpoint accessible');
    console.log('   Users found:', usersResponse.data.data?.length || 0);
    
    // Test 4: Test assignment endpoints
    console.log('\n4. Testing assignment endpoints...');
    const accountsResponse = await axios.get('http://localhost:5000/api/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Accounts endpoint accessible');
    console.log('   Accounts found:', accountsResponse.data.data?.length || 0);
    
    console.log('\n🎉 All basic tests passed! Ready for comprehensive testing.');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.statusText);
      if (error.response.data?.details) {
        console.error('   Details:', error.response.data.details);
      }
    } else if (error.request) {
      console.error('   No response received. Server might be down.');
      console.error('   Error code:', error.code);
    } else {
      console.error('   Error:', error.message);
    }
    
    process.exit(1);
  }
}

testServerAndAuth();
