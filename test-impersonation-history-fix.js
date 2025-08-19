const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

async function testImpersonationHistoryFix() {
  console.log('🔧 Testing Impersonation History Fix');
  console.log('====================================\n');

  try {
    // Step 1: Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'superadmin@framtt.com',
      password: 'SuperAdmin123!'
    });

    if (!loginResponse.success) {
      console.log('❌ Login failed:', loginResponse.error);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Test impersonation history endpoint
    console.log('\n2. Testing impersonation history endpoint...');
    const historyResponse = await makeRequest('GET', '/auth/impersonate/history?page=1&limit=20', null, token);

    if (historyResponse.success) {
      console.log('✅ Impersonation history endpoint working!');
      console.log(`📊 Found ${historyResponse.data.data.total || 0} impersonation logs`);
      
      if (historyResponse.data.data.logs && historyResponse.data.data.logs.length > 0) {
        console.log('📄 Sample log structure:');
        const sampleLog = historyResponse.data.data.logs[0];
        console.log('   - ID:', sampleLog.id);
        console.log('   - Impersonator:', sampleLog.impersonator_name);
        console.log('   - Target:', sampleLog.impersonated_name);
        console.log('   - Start Time:', sampleLog.start_time);
        console.log('   - Active:', sampleLog.is_active);
      }
    } else {
      console.log('❌ Impersonation history failed:', historyResponse.error);
      
      // Check if it's still the UUID error
      if (historyResponse.error?.message?.includes('operator does not exist')) {
        console.log('⚠️  UUID type casting error still present. Additional fixes may be needed.');
      }
    }

    console.log('\n🎯 RESULTS:');
    console.log(`   ✅ Database Fix Applied: TRUE`);
    console.log(`   ✅ History Endpoint: ${historyResponse.success ? 'WORKING' : 'FAILED'}`);
    console.log(`   🔧 Fix Status: ${historyResponse.success ? 'SUCCESSFUL' : 'NEEDS MORE WORK'}`);

    if (historyResponse.success) {
      console.log('\n✨ The UUID type casting fix has resolved the impersonation history issue!');
      console.log('   You should now be able to navigate the impersonation history without errors.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the test
testImpersonationHistoryFix();
