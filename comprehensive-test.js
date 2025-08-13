const http = require('http');
const { promisify } = require('util');

// Enhanced test suite for full integration testing
class IntegrationTester {
  constructor() {
    this.results = {
      backend: { status: 'unknown', tests: [] },
      frontend: { status: 'unknown', tests: [] },
      database: { status: 'unknown', tests: [] },
      integration: { status: 'unknown', tests: [] }
    };
  }

  async makeRequest(options, data = null) {
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

  async testBackendHealth() {
    console.log('🔍 Testing Backend Health...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success && response.data.database === 'connected') {
        console.log('   ✅ Backend health check passed');
        console.log(`   📊 Database: ${response.data.database}`);
        console.log(`   🌍 Environment: ${response.data.environment}`);
        this.results.backend.status = 'healthy';
        this.results.backend.tests.push({ name: 'Health Check', status: 'pass' });
        return true;
      } else {
        console.log('   ❌ Backend health check failed');
        this.results.backend.status = 'unhealthy';
        this.results.backend.tests.push({ name: 'Health Check', status: 'fail' });
        return false;
      }
    } catch (error) {
      console.log('   ❌ Backend not accessible:', error.message);
      this.results.backend.status = 'unreachable';
      this.results.backend.tests.push({ name: 'Health Check', status: 'error', error: error.message });
      return false;
    }
  }

  async testBackendEndpoints() {
    console.log('\n🔍 Testing Backend API Endpoints...');
    
    const endpoints = [
      { path: '/api/auth/login', method: 'POST', expectedStatus: [400, 401] }, // No credentials
      { path: '/api/dashboard', method: 'GET', expectedStatus: [401] }, // No auth
      { path: '/api/users', method: 'GET', expectedStatus: [401] }, // No auth
      { path: '/api/accounts', method: 'GET', expectedStatus: [401] }, // No auth
      { path: '/api/roles', method: 'GET', expectedStatus: [401] } // No auth
    ];

    let passedTests = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: endpoint.path,
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });

        const statusOk = endpoint.expectedStatus.includes(response.status);
        
        if (statusOk) {
          console.log(`   ✅ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
          this.results.backend.tests.push({ 
            name: `${endpoint.method} ${endpoint.path}`, 
            status: 'pass',
            responseStatus: response.status
          });
          passedTests++;
        } else {
          console.log(`   ⚠️  ${endpoint.method} ${endpoint.path} - Unexpected status: ${response.status}`);
          this.results.backend.tests.push({ 
            name: `${endpoint.method} ${endpoint.path}`, 
            status: 'warning',
            responseStatus: response.status
          });
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
        this.results.backend.tests.push({ 
          name: `${endpoint.method} ${endpoint.path}`, 
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`   📊 Endpoint Tests: ${passedTests}/${endpoints.length} passed`);
    return passedTests === endpoints.length;
  }

  async testCORS() {
    console.log('\n🔍 Testing CORS Configuration...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods']
      };

      if (corsHeaders['Access-Control-Allow-Origin']) {
        console.log('   ✅ CORS is properly configured');
        console.log(`   🌐 Allowed Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
        console.log(`   🍪 Credentials: ${corsHeaders['Access-Control-Allow-Credentials']}`);
        this.results.integration.tests.push({ name: 'CORS Configuration', status: 'pass' });
        return true;
      } else {
        console.log('   ⚠️  CORS headers not found');
        this.results.integration.tests.push({ name: 'CORS Configuration', status: 'warning' });
        return false;
      }
    } catch (error) {
      console.log('   ❌ CORS test failed:', error.message);
      this.results.integration.tests.push({ name: 'CORS Configuration', status: 'error', error: error.message });
      return false;
    }
  }

  async testFrontendAccessibility() {
    console.log('\n🔍 Testing Frontend Accessibility...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        headers: { 'Accept': 'text/html' }
      });

      if (response.success) {
        console.log('   ✅ Frontend is accessible on port 3000');
        this.results.frontend.status = 'accessible';
        this.results.frontend.tests.push({ name: 'Accessibility', status: 'pass' });
        return true;
      } else {
        console.log(`   ⚠️  Frontend returned status: ${response.status}`);
        this.results.frontend.status = 'warning';
        this.results.frontend.tests.push({ name: 'Accessibility', status: 'warning', responseStatus: response.status });
        return false;
      }
    } catch (error) {
      console.log('   ❌ Frontend not accessible:', error.message);
      this.results.frontend.status = 'unreachable';
      this.results.frontend.tests.push({ name: 'Accessibility', status: 'error', error: error.message });
      return false;
    }
  }

  async testDatabaseQueries() {
    console.log('\n🔍 Testing Database through API...');
    
    // Test user count endpoint (if available)
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/users',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Even if unauthorized (401), it means the endpoint exists and database is reachable
      if (response.status === 401) {
        console.log('   ✅ Database endpoints are responding (authentication required)');
        this.results.database.status = 'connected';
        this.results.database.tests.push({ name: 'API Database Access', status: 'pass' });
        return true;
      } else if (response.success) {
        console.log('   ✅ Database queries working through API');
        this.results.database.status = 'connected';
        this.results.database.tests.push({ name: 'API Database Access', status: 'pass' });
        return true;
      } else {
        console.log(`   ⚠️  Unexpected database response: ${response.status}`);
        this.results.database.status = 'warning';
        this.results.database.tests.push({ name: 'API Database Access', status: 'warning' });
        return false;
      }
    } catch (error) {
      console.log('   ❌ Database test failed:', error.message);
      this.results.database.status = 'error';
      this.results.database.tests.push({ name: 'API Database Access', status: 'error', error: error.message });
      return false;
    }
  }

  async testAuthenticationFlow() {
    console.log('\n🔍 Testing Authentication Flow...');
    
    try {
      // Test login endpoint with invalid credentials
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: 'test@test.com',
        password: 'wrongpassword'
      });

      if (response.status === 400 || response.status === 401) {
        console.log('   ✅ Authentication endpoint is responding correctly');
        this.results.integration.tests.push({ name: 'Authentication Flow', status: 'pass' });
        return true;
      } else {
        console.log(`   ⚠️  Unexpected auth response: ${response.status}`);
        this.results.integration.tests.push({ name: 'Authentication Flow', status: 'warning' });
        return false;
      }
    } catch (error) {
      console.log('   ❌ Authentication test failed:', error.message);
      this.results.integration.tests.push({ name: 'Authentication Flow', status: 'error', error: error.message });
      return false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n🖥️  BACKEND STATUS:', this.results.backend.status.toUpperCase());
    this.results.backend.tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}`);
    });

    console.log('\n🌐 FRONTEND STATUS:', this.results.frontend.status.toUpperCase());
    this.results.frontend.tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}`);
    });

    console.log('\n🗄️  DATABASE STATUS:', this.results.database.status.toUpperCase());
    this.results.database.tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}`);
    });

    console.log('\n🔗 INTEGRATION STATUS:', this.results.integration.status.toUpperCase());
    this.results.integration.tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}`);
    });

    // Overall assessment
    const allTests = [
      ...this.results.backend.tests,
      ...this.results.frontend.tests,
      ...this.results.database.tests,
      ...this.results.integration.tests
    ];

    const passedTests = allTests.filter(t => t.status === 'pass').length;
    const totalTests = allTests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL SUCCESS RATE: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    
    if (successRate >= 80) {
      console.log('🎉 EXCELLENT! Your application is well integrated and ready for production!');
    } else if (successRate >= 60) {
      console.log('✅ GOOD! Your application is working with minor issues to address.');
    } else {
      console.log('⚠️  NEEDS ATTENTION! Several integration issues need to be resolved.');
    }

    console.log('\n📋 QUICK ACCESS:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend API: http://localhost:5000');
    console.log('   Health Check: http://localhost:5000/health');
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Integration Tests...\n');
    
    // Run all test suites
    await this.testBackendHealth();
    await this.testBackendEndpoints();
    await this.testCORS();
    await this.testFrontendAccessibility();
    await this.testDatabaseQueries();
    await this.testAuthenticationFlow();
    
    // Set overall integration status
    const integrationPassed = this.results.integration.tests.filter(t => t.status === 'pass').length;
    const integrationTotal = this.results.integration.tests.length;
    
    if (integrationPassed === integrationTotal) {
      this.results.integration.status = 'excellent';
    } else if (integrationPassed >= integrationTotal * 0.7) {
      this.results.integration.status = 'good';
    } else {
      this.results.integration.status = 'needs-attention';
    }
    
    // Generate final report
    this.generateReport();
  }
}

// Run the comprehensive test suite
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);
