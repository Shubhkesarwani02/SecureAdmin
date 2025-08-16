const http = require('http');

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Final-Test/1.0'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function finalAPITest() {
  console.log('🎯 FINAL ENDPOINT VALIDATION TEST');
  console.log('=====================================\n');

  try {
    // Login
    console.log('🔐 Testing Authentication...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'superadmin@framtt.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Authentication: SUCCESS\n');

    // Test key endpoints
    const endpoints = [
      { name: 'Health Check', path: '/health', method: 'GET', auth: false },
      { name: 'Dashboard Summary', path: '/api/dashboard/summary', method: 'GET', auth: true },
      { name: 'Users List', path: '/api/users', method: 'GET', auth: true },
      { name: 'User Stats', path: '/api/users/stats', method: 'GET', auth: true },
      { name: 'Clients List', path: '/api/clients', method: 'GET', auth: true },
      { name: 'Vehicles List', path: '/api/vehicles', method: 'GET', auth: true },
      { name: 'Admin Settings', path: '/api/admin/settings', method: 'GET', auth: true },
      { name: 'Notifications', path: '/api/notifications', method: 'GET', auth: true },
      { name: 'Audit Logs', path: '/api/audit/logs', method: 'GET', auth: true },
      { name: 'Account Health', path: '/api/account-health/overview', method: 'GET', auth: true }
    ];

    let passed = 0;
    let total = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest(
          endpoint.method, 
          endpoint.path, 
          null, 
          endpoint.auth ? token : null
        );
        
        if (response.status === 200) {
          console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
          passed++;
        } else {
          console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ERROR (${error.message})`);
      }
    }

    console.log('\n🎯 FINAL RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('🎉 ALL CORE ENDPOINTS ARE WORKING PERFECTLY!');
    } else {
      console.log(`⚠️  ${total - passed} endpoint(s) need attention`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

finalAPITest();
