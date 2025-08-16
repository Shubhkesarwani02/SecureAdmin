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
        'User-Agent': 'Debug-Tester/1.0'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
      console.log(`   Using token: ${token.substring(0, 20)}...`);
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

async function debugEndpoints() {
  try {
    console.log('🔐 Getting superadmin token...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'superadmin@framtt.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse);
      return;
    }

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data.token || loginResponse.data.data.accessToken;
    console.log('✅ Login successful, token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

    // Test the final failing endpoint  
    const endpoints = [
      '/api/audit/logs'
    ];

    for (const endpoint of endpoints) {
      console.log(`🧪 Testing ${endpoint}...`);
      try {
        const response = await makeRequest('GET', endpoint, null, token);
        console.log(`   Status: ${response.status}`);
        if (response.status >= 400) {
          console.log('   Error:', JSON.stringify(response.data, null, 2));
        } else {
          console.log('   ✅ Success');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugEndpoints();
