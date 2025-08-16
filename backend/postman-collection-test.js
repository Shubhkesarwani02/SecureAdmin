const http = require('http');

class PostmanCollectionTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Postman-Collection-Tester/1.0'
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
              headers: res.headers,
              data: parsed
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
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

  logResult(testName, actualStatus, expectedStatus, error = null) {
    this.results.total++;
    if (actualStatus === expectedStatus) {
      this.results.passed++;
      console.log(`✅ ${testName}: SUCCESS (${actualStatus})`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: FAILED (${actualStatus}, expected ${expectedStatus})`);
      if (error) {
        console.log(`   Error: ${error}`);
        this.results.errors.push(`${testName}: ${error}`);
      }
    }
  }

  async testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION');
    console.log('================================\n');

    // Test Superadmin Login
    try {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: 'superadmin@framtt.com',
        password: 'admin123'
      });

      this.logResult('Superadmin Login', response.status, 200);
      
      if (response.status === 200 && response.data.success && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        console.log('   ✅ Auth token extracted successfully');
      } else {
        console.log('   ❌ Failed to extract auth token');
        console.log('   Response structure:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      this.logResult('Superadmin Login', 'ERROR', 200, error.message);
    }

    // Test Get Current User
    if (this.token) {
      try {
        const response = await this.makeRequest('GET', '/api/auth/me', null, this.token);
        this.logResult('Get Current User', response.status, 200);
      } catch (error) {
        this.logResult('Get Current User', 'ERROR', 200, error.message);
      }
    }
  }

  async testCoreEndpoints() {
    if (!this.token) {
      console.log('\n❌ No auth token available, skipping core endpoint tests');
      return;
    }

    console.log('\n📊 TESTING CORE ENDPOINTS');
    console.log('================================\n');

    const endpoints = [
      { name: 'Health Check', path: '/health', method: 'GET', auth: false, expected: 200 },
      { name: 'Dashboard Summary', path: '/api/dashboard/summary', method: 'GET', auth: true, expected: 200 },
      { name: 'Users List', path: '/api/users', method: 'GET', auth: true, expected: 200 },
      { name: 'User Stats', path: '/api/users/stats', method: 'GET', auth: true, expected: 200 },
      { name: 'Clients List', path: '/api/clients', method: 'GET', auth: true, expected: 200 },
      { name: 'Vehicles List', path: '/api/vehicles', method: 'GET', auth: true, expected: 200 },
      { name: 'Admin Settings', path: '/api/admin/settings', method: 'GET', auth: true, expected: 200 },
      { name: 'Notifications', path: '/api/notifications', method: 'GET', auth: true, expected: 200 },
      { name: 'Audit Logs', path: '/api/audit/logs', method: 'GET', auth: true, expected: 200 },
      { name: 'Account Health', path: '/api/account-health/overview', method: 'GET', auth: true, expected: 200 }
    ];

    for (const endpoint of endpoints) {
      try {
        const token = endpoint.auth ? this.token : null;
        const response = await this.makeRequest(endpoint.method, endpoint.path, null, token);
        this.logResult(endpoint.name, response.status, endpoint.expected);
      } catch (error) {
        this.logResult(endpoint.name, 'ERROR', endpoint.expected, error.message);
      }
    }
  }

  async testCreateOperations() {
    if (!this.token) {
      console.log('\n❌ No auth token available, skipping create operation tests');
      return;
    }

    console.log('\n➕ TESTING CREATE OPERATIONS');
    console.log('================================\n');

    // Test Create User
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/users', {
        fullName: `Test User ${timestamp}`,
        email: `testuser${timestamp}@framtt.com`,
        password: 'admin123',
        role: 'user',
        phone: '+1234567890',
        department: 'Operations'
      }, this.token);

      this.logResult('Create User', response.status, 201);
    } catch (error) {
      this.logResult('Create User', 'ERROR', 201, error.message);
    }

    // Test Create Vehicle
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/vehicles', {
        clientId: 1,
        make: 'Toyota',
        model: `Test Model ${timestamp}`,
        year: 2024,
        licensePlate: `TEST${timestamp.toString().slice(-6)}`,
        vin: `1HGBH41JXMN${timestamp.toString().slice(-6)}`,
        category: 'sedan',
        dailyRate: 89.99,
        location: 'Test Location'
      }, this.token);

      this.logResult('Create Vehicle', response.status, 201);
    } catch (error) {
      this.logResult('Create Vehicle', 'ERROR', 201, error.message);
    }

    // Test Create Notification
    try {
      const response = await this.makeRequest('POST', '/api/notifications', {
        title: 'Test Notification',
        description: 'This is a test notification from Postman collection validation',
        type: 'info',
        targetUsers: ['all']
      }, this.token);

      this.logResult('Create Notification', response.status, 201);
    } catch (error) {
      this.logResult('Create Notification', 'ERROR', 201, error.message);
    }
  }

  async runCompleteTest() {
    console.log('🎯 POSTMAN COLLECTION VALIDATION TEST');
    console.log('=====================================\n');

    await this.testAuthentication();
    await this.testCoreEndpoints();
    await this.testCreateOperations();

    console.log('\n🎯 FINAL RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}/${this.results.total}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    } else {
      console.log('🎉 ALL TESTS PASSED - POSTMAN COLLECTION IS READY TO USE!');
    }
  }
}

// Run the test
const tester = new PostmanCollectionTester();
tester.runCompleteTest().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
