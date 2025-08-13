const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode < 400
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            success: res.statusCode < 400
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

async function quickAuthTest() {
  console.log('🔐 Quick Authentication Test...\n');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@framtt.com',
      password: 'admin123'
    });

    if (response.success && response.data.success) {
      const payload = response.data.data || {};
      console.log('✅ Authentication successful!');
      console.log(`   User: ${payload.user?.email}`);
      console.log(`   Role: ${payload.user?.role}`);
      console.log(`   Status: ${payload.user?.status}`);
      const token = payload.accessToken || payload.token;
      if (token) console.log(`   Token: ${token.substring(0, 30)}...`);
      
      // Test a protected endpoint
    const dashboardResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/dashboard',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
        }
      });

      if (dashboardResponse.success) {
        console.log('✅ Dashboard access successful!');
        console.log('   Dashboard data retrieved successfully');
      } else {
        console.log(`❌ Dashboard access failed: ${dashboardResponse.status}`);
      }
    } else {
      console.log('❌ Authentication failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message || 'No message'}`);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

quickAuthTest();
