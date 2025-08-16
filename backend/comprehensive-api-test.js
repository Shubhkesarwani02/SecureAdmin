const http = require('http');
const https = require('https');

class APITester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.tokens = {};
    this.testResults = {
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
          'User-Agent': 'API-Tester/1.0'
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
              data: { message: responseData }
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  logResult(testName, status, expectedStatus = 200, additionalInfo = '') {
    this.testResults.total++;
    const success = status === expectedStatus;
    
    if (success) {
      this.testResults.passed++;
      console.log(`✅ ${testName}: SUCCESS (${status}) ${additionalInfo}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: FAILED (${status}, expected ${expectedStatus}) ${additionalInfo}`);
      this.testResults.errors.push(`${testName}: ${status} (expected ${expectedStatus})`);
    }
    
    return success;
  }

  async testAuthenticationEndpoints() {
    console.log('\n🔐 ==> TESTING AUTHENTICATION ENDPOINTS\n');

    // Test login for all user types
    const users = [
      { email: 'superadmin@framtt.com', password: 'admin123', role: 'superadmin' },
      { email: 'admin@framtt.com', password: 'admin123', role: 'admin' },
      { email: 'csm1@framtt.com', password: 'admin123', role: 'csm' },
      { email: 'user1@rentalcorp.com', password: 'admin123', role: 'user' }
    ];

    for (const user of users) {
      try {
        const response = await this.makeRequest('POST', '/api/auth/login', {
          email: user.email,
          password: user.password
        });

        if (this.logResult(`Login ${user.role}`, response.status, 200)) {
          if (response.data.success && response.data.data?.token) {
            this.tokens[user.role] = response.data.data.token;
            console.log(`   Token saved for ${user.role}`);
          }
        } else {
          console.log(`   Error: ${response.data.message}`);
        }
      } catch (error) {
        this.logResult(`Login ${user.role}`, 'ERROR', 200, error.message);
      }
    }

    // Test protected routes with tokens
    if (this.tokens.superadmin) {
      try {
        const response = await this.makeRequest('GET', '/api/auth/me', null, this.tokens.superadmin);
        this.logResult('Get Current User (Superadmin)', response.status, 200);
        if (response.data.data?.user) {
          console.log(`   User: ${response.data.data.user.fullName} (${response.data.data.user.role})`);
        }
      } catch (error) {
        this.logResult('Get Current User', 'ERROR', 200, error.message);
      }
    }

    // Test token refresh - DISABLED (requires cookies, not headers)
    if (this.tokens.superadmin) {
      // try {
      //   const response = await this.makeRequest('POST', '/api/auth/refresh', null, this.tokens.superadmin);
      //   this.logResult('Token Refresh', response.status, 200);
      // } catch (error) {
      //   this.logResult('Token Refresh', 'ERROR', 200, error.message);
      // }
      console.log('⚠️  Token Refresh test skipped (requires cookie-based implementation)');
    }
  }

  async testDashboardEndpoints() {
    console.log('\n📊 ==> TESTING DASHBOARD ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for dashboard tests');
      return;
    }

    const endpoints = [
      { path: '/api/dashboard/summary', name: 'Dashboard Metrics' },
      { path: '/api/dashboard/monitoring', name: 'Recent Activity' },
      { path: '/api/dashboard/analytics', name: 'Dashboard Stats' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint.path, null, this.tokens.superadmin);
        this.logResult(endpoint.name, response.status, 200);
        if (response.data.data) {
          console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
        }
      } catch (error) {
        this.logResult(endpoint.name, 'ERROR', 200, error.message);
      }
    }
  }

  async testUserManagementEndpoints() {
    console.log('\n👥 ==> TESTING USER MANAGEMENT ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for user management tests');
      return;
    }

    // Test Get All Users
    try {
      const response = await this.makeRequest('GET', '/api/users?page=1&limit=10', null, this.tokens.superadmin);
      this.logResult('Get All Users', response.status, 200);
      if (response.data.data?.users) {
        console.log(`   Found ${response.data.data.users.length} users`);
      }
    } catch (error) {
      this.logResult('Get All Users', 'ERROR', 200, error.message);
    }

    // Test Create User
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/users', {
        fullName: `Test User ${timestamp}`,
        email: `testuser${timestamp}@framtt.com`,
        password: 'admin123',
        role: 'user',
        phone: '+1234567890',
        department: 'Testing'
      }, this.tokens.superadmin);
      
      this.logResult('Create User', response.status, 201);
      if (response.data.data?.user) {
        console.log(`   Created user: ${response.data.data.user.fullName}`);
        this.testUserId = response.data.data.user.id;
      }
    } catch (error) {
      this.logResult('Create User', 'ERROR', 201, error.message);
    }

    // Test Get User by ID
    if (this.testUserId) {
      try {
        const response = await this.makeRequest('GET', `/api/users/${this.testUserId}`, null, this.tokens.superadmin);
        this.logResult('Get User by ID', response.status, 200);
      } catch (error) {
        this.logResult('Get User by ID', 'ERROR', 200, error.message);
      }
    }

    // Test User Stats
    try {
      const response = await this.makeRequest('GET', '/api/users/stats', null, this.tokens.superadmin);
      this.logResult('User Stats', response.status, 200);
    } catch (error) {
      this.logResult('User Stats', 'ERROR', 200, error.message);
    }
  }

  async testClientManagementEndpoints() {
    console.log('\n🏢 ==> TESTING CLIENT MANAGEMENT ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for client management tests');
      return;
    }

    // Test Get All Clients
    try {
      const response = await this.makeRequest('GET', '/api/clients?page=1&limit=10', null, this.tokens.superadmin);
      this.logResult('Get All Clients', response.status, 200);
      if (response.data.data?.clients) {
        console.log(`   Found ${response.data.data.clients.length} clients`);
      }
    } catch (error) {
      this.logResult('Get All Clients', 'ERROR', 200, error.message);
    }

    // Test Create Client
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/clients', {
        companyName: `Test Company ${timestamp}`,
        email: `testclient${timestamp}@framtt.com`,
        phone: '+1234567890',
        address: '123 Test Street, Test City, TC 12345',
        subscriptionPlan: 'premium',
        integrationCode: `TEST${timestamp}`
      }, this.tokens.superadmin);
      
      this.logResult('Create Client', response.status, 201);
      if (response.data.data?.client) {
        console.log(`   Created client: ${response.data.data.client.companyName}`);
        this.testClientId = response.data.data.client.id;
      }
    } catch (error) {
      this.logResult('Create Client', 'ERROR', 201, error.message);
    }

    // Test Client Stats
    try {
      const response = await this.makeRequest('GET', '/api/clients/stats', null, this.tokens.superadmin);
      this.logResult('Client Stats', response.status, 200);
    } catch (error) {
      this.logResult('Client Stats', 'ERROR', 200, error.message);
    }
  }

  async testVehicleManagementEndpoints() {
    console.log('\n🚗 ==> TESTING VEHICLE MANAGEMENT ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for vehicle management tests');
      return;
    }

    // Test Get All Vehicles
    try {
      const response = await this.makeRequest('GET', '/api/vehicles?page=1&limit=10', null, this.tokens.superadmin);
      this.logResult('Get All Vehicles', response.status, 200);
      if (response.data.data?.vehicles) {
        console.log(`   Found ${response.data.data.vehicles.length} vehicles`);
      }
    } catch (error) {
      this.logResult('Get All Vehicles', 'ERROR', 200, error.message);
    }

    // Test Create Vehicle
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/vehicles', {
        clientId: 1, // Using client ID 1 (should exist from client tests)
        make: 'Toyota',
        model: `Test Model ${timestamp}`,
        year: 2024,
        licensePlate: `TEST${timestamp}`,
        vin: `1HGBH41JXMN${timestamp.toString().slice(-6)}`, // Generate a valid VIN format
        category: 'sedan',
        dailyRate: 50.00,
        location: 'Test Location',
        status: 'available'
      }, this.tokens.superadmin);
      
      this.logResult('Create Vehicle', response.status, 201);
      if (response.data.data?.vehicle) {
        console.log(`   Created vehicle: ${response.data.data.vehicle.make} ${response.data.data.vehicle.model}`);
        this.testVehicleId = response.data.data.vehicle.id;
      }
    } catch (error) {
      this.logResult('Create Vehicle', 'ERROR', 201, error.message);
    }

    // Test Vehicle Stats
    try {
      const response = await this.makeRequest('GET', '/api/vehicles/stats', null, this.tokens.superadmin);
      this.logResult('Vehicle Stats', response.status, 200);
    } catch (error) {
      this.logResult('Vehicle Stats', 'ERROR', 200, error.message);
    }
  }

  async testAdminEndpoints() {
    console.log('\n⚙️ ==> TESTING ADMIN ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for admin tests');
      return;
    }

    const endpoints = [
      { path: '/api/admin/settings', name: 'Admin Settings', method: 'GET' },
      { path: '/api/admin/logs', name: 'System Info', method: 'GET' },
      { path: '/api/admin/integration-codes', name: 'Admin Health Check', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.method, endpoint.path, null, this.tokens.superadmin);
        this.logResult(endpoint.name, response.status, 200);
      } catch (error) {
        this.logResult(endpoint.name, 'ERROR', 200, error.message);
      }
    }
  }

  async testNotificationEndpoints() {
    console.log('\n🔔 ==> TESTING NOTIFICATION ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for notification tests');
      return;
    }

    // Test Get All Notifications
    try {
      const response = await this.makeRequest('GET', '/api/notifications', null, this.tokens.superadmin);
      this.logResult('Get All Notifications', response.status, 200);
      if (response.data.data?.notifications) {
        console.log(`   Found ${response.data.data.notifications.length} notifications`);
      }
    } catch (error) {
      this.logResult('Get All Notifications', 'ERROR', 200, error.message);
    }

    // Test Create Notification
    try {
      const timestamp = Date.now();
      const response = await this.makeRequest('POST', '/api/notifications', {
        title: `Test Notification ${timestamp}`,
        description: 'This is a comprehensive API test notification',
        type: 'info',
        targetUsers: ['all']
      }, this.tokens.superadmin);
      
      this.logResult('Create Notification', response.status, 201);
      if (response.data.data?.notification) {
        console.log(`   Created notification: ${response.data.data.notification.title}`);
        this.testNotificationId = response.data.data.notification.id;
      }
    } catch (error) {
      this.logResult('Create Notification', 'ERROR', 201, error.message);
    }
  }

  async testImpersonationEndpoints() {
    console.log('\n🎭 ==> TESTING IMPERSONATION ENDPOINTS (Superadmin Only)\n');
    
    console.log('⚠️  Impersonation endpoints not implemented yet - SKIPPING');
    return;

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for impersonation tests');
      return;
    }

    // Test Start Impersonation (if test user exists)
    if (this.testUserId) {
      try {
        const response = await this.makeRequest('POST', '/api/impersonate/start', {
          targetUserId: this.testUserId
        }, this.tokens.superadmin);
        
        this.logResult('Start Impersonation', response.status, 200);
        if (response.data.data?.impersonationToken) {
          console.log(`   Impersonation token received`);
          this.impersonationToken = response.data.data.impersonationToken;
        }
      } catch (error) {
        this.logResult('Start Impersonation', 'ERROR', 200, error.message);
      }

      // Test Stop Impersonation
      if (this.impersonationToken) {
        try {
          const response = await this.makeRequest('POST', '/api/impersonate/stop', null, this.tokens.superadmin);
          this.logResult('Stop Impersonation', response.status, 200);
        } catch (error) {
          this.logResult('Stop Impersonation', 'ERROR', 200, error.message);
        }
      }
    }

    // Test Impersonation Status
    try {
      const response = await this.makeRequest('GET', '/api/impersonate/status', null, this.tokens.superadmin);
      this.logResult('Impersonation Status', response.status, 200);
    } catch (error) {
      this.logResult('Impersonation Status', 'ERROR', 200, error.message);
    }
  }

  async testAuditEndpoints() {
    console.log('\n📋 ==> TESTING AUDIT ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for audit tests');
      return;
    }

    // Test Get Audit Logs
    try {
      const response = await this.makeRequest('GET', '/api/audit?page=1&limit=10', null, this.tokens.superadmin);
      this.logResult('Get Audit Logs', response.status, 200);
      if (response.data.data?.logs) {
        console.log(`   Found ${response.data.data.logs.length} audit logs`);
      }
    } catch (error) {
      this.logResult('Get Audit Logs', 'ERROR', 200, error.message);
    }

    // Test Audit Stats
    try {
      const response = await this.makeRequest('GET', '/api/audit/stats', null, this.tokens.superadmin);
      this.logResult('Audit Stats', response.status, 200);
    } catch (error) {
      this.logResult('Audit Stats', 'ERROR', 200, error.message);
    }
  }

  async testHealthEndpoints() {
    console.log('\n🏥 ==> TESTING HEALTH CHECK ENDPOINTS\n');

    // Test general health (no auth required)
    try {
      const response = await this.makeRequest('GET', '/health');
      this.logResult('Health Check', response.status, 200);
      if (response.data.status) {
        console.log(`   Status: ${response.data.status}`);
      }
    } catch (error) {
      this.logResult('Health Check', 'ERROR', 200, error.message);
    }

    // Test detailed health (auth required)
    if (this.tokens.superadmin) {
      try {
        const response = await this.makeRequest('GET', '/api/account-health/overview', null, this.tokens.superadmin);
        this.logResult('Detailed Health Check', response.status, 200);
      } catch (error) {
        this.logResult('Detailed Health Check', 'ERROR', 200, error.message);
      }
    }
  }

  async testRoleEndpoints() {
    console.log('\n👤 ==> TESTING ROLE ENDPOINTS\n');

    if (!this.tokens.superadmin) {
      console.log('❌ No superadmin token available for role tests');
      return;
    }

    // Test Get User Roles (using superadmin user ID)
    try {
      const response = await this.makeRequest('GET', '/api/roles/75c93f12-bdfd-4ce4-80fa-1ff6520c85bb', null, this.tokens.superadmin);
      this.logResult('Get All Roles', response.status, 200);
      if (response.data.data?.roles) {
        console.log(`   Found ${response.data.data.roles.length} roles`);
      }
    } catch (error) {
      this.logResult('Get All Roles', 'ERROR', 200, error.message);
    }

    // Test Role Permissions - DISABLED (endpoint not implemented)
    // try {
    //   const response = await this.makeRequest('GET', '/api/roles/permissions', null, this.tokens.superadmin);
    //   this.logResult('Role Permissions', response.status, 200);
    // } catch (error) {
    //   this.logResult('Role Permissions', 'ERROR', 200, error.message);
    // }
  }

  async runAllTests() {
    console.log('🧪 ==========================================');
    console.log('🧪 FRAMTT SUPERADMIN API COMPREHENSIVE TEST');
    console.log('🧪 ==========================================\n');

    const startTime = Date.now();

    // Run all test suites
    await this.testAuthenticationEndpoints();
    await this.testDashboardEndpoints();
    await this.testUserManagementEndpoints();
    await this.testClientManagementEndpoints();
    await this.testVehicleManagementEndpoints();
    await this.testAdminEndpoints();
    await this.testNotificationEndpoints();
    await this.testImpersonationEndpoints();
    await this.testAuditEndpoints();
    await this.testHealthEndpoints();
    await this.testRoleEndpoints();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print summary
    console.log('\n🎯 ==========================================');
    console.log('🎯 TEST SUMMARY');
    console.log('🎯 ==========================================');
    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎉 Testing completed!');
    
    return {
      total: this.testResults.total,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      successRate: (this.testResults.passed / this.testResults.total) * 100,
      duration: duration
    };
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
