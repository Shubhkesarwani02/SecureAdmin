const http = require('http');

const testEndpoint = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && data.token) {
      options.headers['Authorization'] = `Bearer ${data.token}`;
      delete data.token;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: { message: responseData }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function testAdminEndpoints() {
  console.log('🔧 Testing Admin Management Endpoints\n');
  
  // First login as superadmin to get token
  console.log('1. 🔐 Getting Superadmin Token...');
  try {
    const login = await testEndpoint('POST', '/api/auth/login', {
      email: 'superadmin@framtt.com',
      password: 'admin123'
    });
    
    if (login.status !== 200 || !login.data.success) {
      console.log('❌ Failed to login as superadmin');
      return;
    }
    
    const token = login.data.data.token;
    console.log('✅ Superadmin login successful');

    // Test Admin Settings
    console.log('\n2. ⚙️ Testing Admin Settings...');
    try {
      const settings = await testEndpoint('GET', '/api/admin/settings', { token });
      console.log(`   ✅ GET Settings: ${settings.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ GET Settings: ERROR - ${error.message}`);
    }

    // Test System Logs
    console.log('\n3. 📋 Testing System Logs...');
    try {
      const logs = await testEndpoint('GET', '/api/admin/logs', { token });
      console.log(`   ✅ GET Logs: ${logs.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ GET Logs: ERROR - ${error.message}`);
    }

    // Test Integration Codes
    console.log('\n4. 🔗 Testing Integration Codes...');
    try {
      const codes = await testEndpoint('GET', '/api/admin/integration-codes', { token });
      console.log(`   ✅ GET Integration Codes: ${codes.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ GET Integration Codes: ERROR - ${error.message}`);
    }

    // Test Update Settings
    console.log('\n5. 🔄 Testing Update Settings...');
    try {
      const update = await testEndpoint('PUT', '/api/admin/settings', {
        token,
        systemMaintenance: false,
        allowRegistration: true,
        maxUploadSize: '10MB'
      });
      console.log(`   ✅ PUT Settings: ${update.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ PUT Settings: ERROR - ${error.message}`);
    }

    // Test Dashboard Analytics
    console.log('\n6. 📊 Testing Dashboard Analytics...');
    try {
      const analytics = await testEndpoint('GET', '/api/dashboard/analytics', { token });
      console.log(`   ✅ GET Analytics: ${analytics.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ GET Analytics: ERROR - ${error.message}`);
    }

    // Test System Monitoring
    console.log('\n7. 🖥️ Testing System Monitoring...');
    try {
      const monitoring = await testEndpoint('GET', '/api/dashboard/monitoring', { token });
      console.log(`   ✅ GET Monitoring: ${monitoring.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ❌ GET Monitoring: ERROR - ${error.message}`);
    }

  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }

  console.log('\n🎉 Admin Endpoint Testing Complete!');
}

testAdminEndpoints().catch(console.error);
