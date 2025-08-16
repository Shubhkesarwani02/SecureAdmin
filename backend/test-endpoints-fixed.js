const https = require('https');
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

async function testAllEndpoints() {
  console.log('🧪 Testing Framtt Superadmin API Endpoints\n');
  
  // Test 1: Health Check
  console.log('1. 🔍 Testing Health Check...');
  try {
    const health = await testEndpoint('GET', '/health');
    console.log(`   ✅ Status: ${health.status} - ${health.data.message || 'OK'}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 2: Login - Get tokens for different users
  console.log('\n2. 🔐 Testing Authentication...');
  const tokens = {};
  
  const users = [
    { email: 'admin@framtt.com', role: 'Admin' },
    { email: 'superadmin@framtt.com', role: 'Superadmin' },
    { email: 'csm1@framtt.com', role: 'CSM1' },
    { email: 'csm2@framtt.com', role: 'CSM2' }
  ];

  for (const user of users) {
    try {
      const login = await testEndpoint('POST', '/api/auth/login', {
        email: user.email,
        password: 'admin123'
      });
      
      if (login.status === 200 && login.data.success) {
        console.log(`   ✅ ${user.role} Login (${user.email}): SUCCESS`);
        tokens[user.email] = login.data.data.token;
      } else {
        console.log(`   ❌ ${user.role} Login (${user.email}): FAILED - ${login.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ${user.role} Login (${user.email}): ERROR - ${error.message}`);
    }
  }

  // Choose the best token for testing (superadmin preferred)
  const superadminToken = tokens['superadmin@framtt.com'] || tokens['admin@framtt.com'];
  
  if (!superadminToken) {
    console.log('\n❌ No superadmin login found. Cannot test protected endpoints.');
    return;
  }

  console.log(`\n   ℹ️  Using superadmin token for protected endpoints...`);

  // Test 3: Get Current User
  console.log('\n3. 👤 Testing Get Current User...');
  try {
    const me = await testEndpoint('GET', '/api/auth/me', { token: superadminToken });
    if (me.status === 200) {
      console.log(`   ✅ Get Me: SUCCESS - ${me.data.data.user.fullName} (${me.data.data.user.role})`);
    } else {
      console.log(`   ❌ Get Me: FAILED - ${me.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Me: ERROR - ${error.message}`);
  }

  // Test 4: Dashboard (requires superadmin)
  console.log('\n4. 📊 Testing Dashboard...');
  try {
    const dashboard = await testEndpoint('GET', '/api/dashboard/summary', { token: superadminToken });
    if (dashboard.status === 200) {
      console.log(`   ✅ Dashboard Summary: SUCCESS`);
    } else {
      console.log(`   ❌ Dashboard Summary: FAILED - ${dashboard.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Dashboard Summary: ERROR - ${error.message}`);
  }

  // Test 5: Users (requires superadmin)
  console.log('\n5. 👥 Testing Users Endpoint...');
  try {
    const users = await testEndpoint('GET', '/api/users', { token: superadminToken });
    if (users.status === 200) {
      const userCount = users.data.data && users.data.data.users ? users.data.data.users.length : 0;
      console.log(`   ✅ Get Users: SUCCESS - Found ${userCount} users`);
    } else {
      console.log(`   ❌ Get Users: FAILED - ${users.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Users: ERROR - ${error.message}`);
  }

  // Test 6: Clients (requires superadmin)
  console.log('\n6. 🏢 Testing Clients Endpoint...');
  try {
    const clients = await testEndpoint('GET', '/api/clients', { token: superadminToken });
    if (clients.status === 200) {
      const clientCount = clients.data.data && clients.data.data.clients ? clients.data.data.clients.length : 0;
      console.log(`   ✅ Get Clients: SUCCESS - Found ${clientCount} clients`);
    } else {
      console.log(`   ❌ Get Clients: FAILED - ${clients.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Clients: ERROR - ${error.message}`);
  }

  // Test 7: Vehicles (requires superadmin)
  console.log('\n7. 🚗 Testing Vehicles Endpoint...');
  try {
    const vehicles = await testEndpoint('GET', '/api/vehicles', { token: superadminToken });
    if (vehicles.status === 200) {
      const vehicleCount = vehicles.data.data && vehicles.data.data.vehicles ? vehicles.data.data.vehicles.length : 0;
      console.log(`   ✅ Get Vehicles: SUCCESS - Found ${vehicleCount} vehicles`);
    } else {
      console.log(`   ❌ Get Vehicles: FAILED - ${vehicles.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Vehicles: ERROR - ${error.message}`);
  }

  // Test 8: Notifications
  console.log('\n8. 🔔 Testing Notifications...');
  try {
    const notifications = await testEndpoint('GET', '/api/notifications', { token: superadminToken });
    if (notifications.status === 200) {
      console.log(`   ✅ Get Notifications: SUCCESS`);
    } else {
      console.log(`   ❌ Get Notifications: FAILED - ${notifications.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Notifications: ERROR - ${error.message}`);
  }

  // Test 9: Admin Settings
  console.log('\n9. ⚙️ Testing Admin Settings...');
  try {
    const settings = await testEndpoint('GET', '/api/admin/settings', { token: superadminToken });
    if (settings.status === 200) {
      console.log(`   ✅ Get Admin Settings: SUCCESS`);
    } else {
      console.log(`   ❌ Get Admin Settings: FAILED - ${settings.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Admin Settings: ERROR - ${error.message}`);
  }

  console.log('\n🎉 API Endpoint Testing Complete!');
}

testAllEndpoints().catch(console.error);
