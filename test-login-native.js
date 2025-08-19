const http = require('http');

console.log('🧪 TESTING LOGIN FUNCTIONALITY');
console.log('='.repeat(40));

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
};

const testLogin = async () => {
  try {
    console.log('📋 Testing login endpoint...');
    
    const postData = JSON.stringify({
      email: 'admin@framtt.com',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    
    console.log('📄 Response status:', response.statusCode);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200 && response.data?.accessToken) {
      console.log('✅ Login successful!');
      console.log('🔑 Access token received');
      return { success: true, token: response.data.accessToken };
    } else if (response.statusCode === 200) {
      console.log('⚠️ Login response received but no access token');
      return { success: false, error: 'No access token' };
    } else {
      console.log('❌ Login failed!');
      console.log('📄 Error message:', response.data?.message || 'Unknown error');
      return { success: false, error: response.data?.message || 'Login failed' };
    }
    
  } catch (error) {
    console.log('❌ Login request failed!');
    console.log('📄 Error:', error.message);
    return { success: false, error: error.message };
  }
};

const testProtectedEndpoint = async (token) => {
  try {
    console.log('📋 Testing protected endpoint with token...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log('📄 Protected endpoint status:', response.statusCode);
    
    if (response.statusCode === 200) {
      console.log('✅ Protected endpoint accessible with token');
      return true;
    } else if (response.statusCode === 401) {
      console.log('❌ Token not accepted (401 unauthorized)');
      return false;
    } else {
      console.log('⚠️ Unexpected response:', response.statusCode);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Protected endpoint test failed:', error.message);
    return false;
  }
};

const testUnauthorizedAccess = async () => {
  try {
    console.log('📋 Testing unauthorized access...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log('📄 Unauthorized access status:', response.statusCode);
    
    if (response.statusCode === 401) {
      console.log('✅ Endpoint properly protected (401 unauthorized)');
      return true;
    } else {
      console.log('⚠️ Endpoint accessible without authentication');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Unauthorized access test failed:', error.message);
    return false;
  }
};

const runTests = async () => {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  // Test login
  const loginResult = await testLogin();
  console.log('');
  
  // Test unauthorized access
  const unauthorizedTest = await testUnauthorizedAccess();
  console.log('');
  
  // Test authorized access if login succeeded
  let authorizedTest = false;
  if (loginResult.success && loginResult.token) {
    authorizedTest = await testProtectedEndpoint(loginResult.token);
    console.log('');
  }
  
  // Summary
  console.log('📊 TEST SUMMARY:');
  console.log('================');
  console.log(`🔐 Login functionality: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🛡️ Unauthorized protection: ${unauthorizedTest ? '✅ PASS' : '❌ FAIL'}`);
  if (loginResult.success) {
    console.log(`🔑 Authorized access: ${authorizedTest ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  if (loginResult.success && unauthorizedTest && authorizedTest) {
    console.log('\n🎉 ALL TESTS PASSED: Authentication system working correctly!');
  } else if (loginResult.success) {
    console.log('\n⚠️ PARTIAL SUCCESS: Login works but some issues detected');
  } else {
    console.log('\n❌ TESTS FAILED: Login functionality needs fixing');
    console.log('💡 Error:', loginResult.error);
  }
  
  console.log('\n🔚 Testing complete');
};

runTests();
