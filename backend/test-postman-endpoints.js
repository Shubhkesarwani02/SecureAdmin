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

async function testUpdatedEndpoints() {
  console.log('🧪 Testing Updated Postman Collection Endpoints\n');
  
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

    // Test User Creation with unique email
    console.log('\n2. 👥 Testing User Creation...');
    try {
      const timestamp = Date.now();
      const createUser = await testEndpoint('POST', '/api/users', {
        token,
        fullName: `Test User ${timestamp}`,
        email: `testuser${timestamp}@framtt.com`,
        password: 'admin123',
        role: 'user',
        phone: '+1234567890',
        department: 'Operations'
      });
      console.log(`   ✅ Create User: ${createUser.status === 201 ? 'SUCCESS' : 'FAILED'} (${createUser.status})`);
      if (createUser.status !== 201) {
        console.log(`   Error: ${createUser.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Create User: ERROR - ${error.message}`);
    }

    // Test Client Creation with correct body
    console.log('\n3. 🏢 Testing Client Creation...');
    try {
      const createClient = await testEndpoint('POST', '/api/clients', {
        token,
        companyName: 'Test Rental Company',
        email: 'contact@testrentals.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City, TC 12345',
        subscriptionPlan: 'premium',
        integrationCode: 'TEST001'
      });
      console.log(`   ✅ Create Client: ${createClient.status === 201 ? 'SUCCESS' : 'FAILED'} (${createClient.status})`);
      if (createClient.status !== 201) {
        console.log(`   Error: ${createClient.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Create Client: ERROR - ${error.message}`);
    }

    // Test Get Current User
    console.log('\n4. 👤 Testing Get Current User...');
    try {
      const me = await testEndpoint('GET', '/api/auth/me', { token });
      console.log(`   ✅ Get Me: ${me.status === 200 ? 'SUCCESS' : 'FAILED'} (${me.status})`);
      if (me.status === 200) {
        console.log(`   User: ${me.data.data.user.fullName} (${me.data.data.user.role})`);
      }
    } catch (error) {
      console.log(`   ❌ Get Me: ERROR - ${error.message}`);
    }

    // Test Notifications with correct body
    console.log('\n5. 🔔 Testing Create Notification...');
    try {
      const createNotification = await testEndpoint('POST', '/api/notifications', {
        token,
        title: 'Test Notification from Postman',
        description: 'This is a test notification created via API',
        type: 'info',
        targetUsers: ['all']
      });
      console.log(`   ✅ Create Notification: ${createNotification.status === 201 ? 'SUCCESS' : 'FAILED'} (${createNotification.status})`);
      if (createNotification.status !== 201) {
        console.log(`   Error: ${createNotification.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Create Notification: ERROR - ${error.message}`);
    }

    // Test Change Password endpoint with proper password
    console.log('\n6. 🔒 Testing Change Password...');
    try {
      const changePassword = await testEndpoint('PUT', '/api/auth/change-password', {
        token,
        currentPassword: 'admin123',
        newPassword: 'NewP@ssw0rd123!' // Meets all requirements
      });
      console.log(`   ✅ Change Password: ${changePassword.status === 200 ? 'SUCCESS' : 'FAILED'} (${changePassword.status})`);
      if (changePassword.status !== 200) {
        console.log(`   Error: ${changePassword.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Change Password: ERROR - ${error.message}`);
    }

  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }

  console.log('\n🎉 Updated Endpoint Testing Complete!');
}

testUpdatedEndpoints().catch(console.error);
