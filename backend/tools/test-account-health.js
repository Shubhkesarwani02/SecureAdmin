// Account Health API Test Script
// Test the account health endpoints integration

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test configuration
const testConfig = {
  // You'll need to provide a valid JWT token for testing
  // Replace this with a real token or implement login flow
  authToken: 'Bearer your_jwt_token_here',
  
  endpoints: [
    {
      name: 'Account Health Overview',
      method: 'GET',
      url: '/api/account-health/overview',
      requiresAuth: true
    },
    {
      name: 'Account Health Scores',
      method: 'GET', 
      url: '/api/account-health/scores',
      requiresAuth: true
    },
    {
      name: 'Account Health Alerts',
      method: 'GET',
      url: '/api/account-health/alerts',
      requiresAuth: true
    },
    {
      name: 'Client Health Details',
      method: 'GET',
      url: '/api/account-health/client/1',
      requiresAuth: true
    },
    {
      name: 'High Risk Clients',
      method: 'GET',
      url: '/api/account-health/high-risk',
      requiresAuth: true
    }
  ]
};

async function testEndpoint(endpoint) {
  const config = {
    method: endpoint.method,
    url: `${API_BASE_URL}${endpoint.url}`,
    headers: {}
  };

  if (endpoint.requiresAuth) {
    config.headers.Authorization = testConfig.authToken;
  }

  try {
    console.log(`\\n🧪 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${endpoint.url}`);
    
    const response = await axios(config);
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2));
    
    return { success: true, endpoint: endpoint.name, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    console.log(`   ❌ Status: ${status}`);
    console.log(`   📝 Error: ${message}`);
    
    return { success: false, endpoint: endpoint.name, status, error: message };
  }
}

async function runTests() {
  console.log('🚀 Starting Account Health API Tests\\n');
  console.log(`📍 Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Auth Token: ${testConfig.authToken.substring(0, 20)}...\\n`);
  
  const results = [];
  
  for (const endpoint of testConfig.endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.endpoint}: ${r.status} - ${r.error}`));
  }
  
  console.log('\\n🏁 Tests Complete!');
}

// Health check function
async function checkServerHealth() {
  try {
    console.log('🏥 Checking server health...');
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log(`✅ Server is running: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Server not reachable: ${error.message}`);
    console.log('\\n💡 Make sure to start the backend server first:');
    console.log('   cd backend && npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverUp = await checkServerHealth();
  
  if (!serverUp) {
    process.exit(1);
  }
  
  // Check if auth token is configured
  if (testConfig.authToken === 'Bearer your_jwt_token_here') {
    console.log('\\n⚠️  Warning: Default auth token detected!');
    console.log('\\n🔑 To test authenticated endpoints:');
    console.log('1. Start the backend server: cd backend && npm start');
    console.log('2. Login via POST /api/auth/login to get a real token');
    console.log('3. Replace the authToken in this script');
    console.log('\\n🚀 Running tests with default token (some may fail)...');
  }
  
  await runTests();
}

// Export for use in other scripts
module.exports = {
  testEndpoint,
  runTests,
  checkServerHealth
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
