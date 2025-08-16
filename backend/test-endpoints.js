const https = require('http');

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

    if (data && typeof data === 'object') {
      options.headers['Authorization'] = `Bearer ${data.token}`;
      delete data.token;
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
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

  // Test 2: Login
  console.log('\n2. 🔐 Testing Authentication...');
  let authToken = '';
  const tokens = {}; // Store tokens for each user
  
  const users = [
    { email: 'admin@framtt.com', role: 'Superadmin' },
    { email: 'admin.user@framtt.com', role: 'Admin' },
    { email: 'csm1@framtt.com', role: 'CSM1' },
    { email: 'csm2@framtt.com', role: 'CSM2' },
    { email: 'superadmin@framtt.com', role: 'Super Admin' }
  ];

  for (const user of users) {
    try {
      const login = await testEndpoint('POST', '/api/auth/login', {
        email: user.email,
        password: 'admin123'
      });
      
      if (login.status === 200 && login.data.success) {
        console.log(`   ✅ ${user.role} Login: SUCCESS`);
        tokens[user.email] = login.data.data.token; // Save token for this user
        if (!authToken) authToken = login.data.data.token; // Save first successful token
      } else {
        console.log(`   ❌ ${user.role} Login: FAILED - ${login.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ${user.role} Login: ERROR - ${error.message}`);
    }
  }

  if (!authToken) {
    console.log('\n❌ No successful login found. Cannot test protected endpoints.');
    return;
  }

  // Use superadmin token for protected endpoints if available
  const superadminToken = tokens['superadmin@framtt.com'] || tokens['admin@framtt.com'] || authToken;

  // Test 3: Get Current User
  console.log('\n3. 👤 Testing Get Current User...');
  try {
    const me = await testEndpoint('GET', '/api/auth/me', { token: authToken });
    if (me.status === 200) {
      console.log(`   ✅ Get Me: SUCCESS - ${me.data.data.user.fullName} (${me.data.data.user.role})`);
    } else {
      console.log(`   ❌ Get Me: FAILED - ${me.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Me: ERROR - ${error.message}`);
  }

  // Test 4: Dashboard
  console.log('\n4. 📊 Testing Dashboard...');
  try {
    const dashboard = await testEndpoint('GET', '/api/dashboard/summary', { token: authToken });
    if (dashboard.status === 200) {
      console.log(`   ✅ Dashboard Summary: SUCCESS`);
    } else {
      console.log(`   ❌ Dashboard Summary: FAILED - ${dashboard.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Dashboard Summary: ERROR - ${error.message}`);
  }

  // Test 5: Users
  console.log('\n5. 👥 Testing Users Endpoint...');
  try {
    const users = await testEndpoint('GET', '/api/users', { token: authToken });
    if (users.status === 200) {
      console.log(`   ✅ Get Users: SUCCESS - Found ${users.data.data.users.length} users`);
    } else {
      console.log(`   ❌ Get Users: FAILED - ${users.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Users: ERROR - ${error.message}`);
  }

  // Test 6: Clients
  console.log('\n6. 🏢 Testing Clients Endpoint...');
  try {
    const clients = await testEndpoint('GET', '/api/clients', { token: authToken });
    if (clients.status === 200) {
      console.log(`   ✅ Get Clients: SUCCESS`);
    } else {
      console.log(`   ❌ Get Clients: FAILED - ${clients.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Clients: ERROR - ${error.message}`);
  }

  // Test 7: Vehicles
  console.log('\n7. 🚗 Testing Vehicles Endpoint...');
  try {
    const vehicles = await testEndpoint('GET', '/api/vehicles', { token: authToken });
    if (vehicles.status === 200) {
      console.log(`   ✅ Get Vehicles: SUCCESS`);
    } else {
      console.log(`   ❌ Get Vehicles: FAILED - ${vehicles.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Get Vehicles: ERROR - ${error.message}`);
  }

  console.log('\n🎉 API Endpoint Testing Complete!');
}

testAllEndpoints().catch(console.error);
