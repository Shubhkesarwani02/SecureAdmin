const axios = require('axios');

console.log('🧪 TESTING LOGIN FUNCTIONALITY');
console.log('='.repeat(40));

const testLogin = async () => {
  try {
    console.log('📋 Testing login endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@framtt.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Login successful!');
    console.log('📄 Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.accessToken) {
      console.log('🔑 Access token received');
      return true;
    } else {
      console.log('❌ No access token in response');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('📄 Error status:', error.response?.status || 'No status');
    console.log('📄 Error message:', error.response?.data?.message || error.message);
    console.log('📄 Full error:', JSON.stringify(error.response?.data || error.message, null, 2));
    return false;
  }
};

const testEndpoints = async () => {
  console.log('🌐 Testing other endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
    console.log('✅ Health endpoint working:', healthResponse.status);
  } catch (error) {
    console.log('⚠️ Health endpoint not available');
  }
  
  try {
    // Test users endpoint (should require authentication)
    const usersResponse = await axios.get('http://localhost:5000/api/users', { timeout: 3000 });
    console.log('⚠️ Users endpoint accessible without auth (this might be intentional)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Users endpoint properly protected (401 unauthorized)');
    } else {
      console.log('⚠️ Users endpoint error:', error.response?.status || error.message);
    }
  }
};

const runTests = async () => {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const loginSuccess = await testLogin();
  console.log('');
  
  await testEndpoints();
  console.log('');
  
  if (loginSuccess) {
    console.log('🎉 PRIMARY TEST PASSED: Login functionality working!');
  } else {
    console.log('❌ PRIMARY TEST FAILED: Login needs investigation');
  }
  
  console.log('\n🔚 Testing complete');
};

runTests();
