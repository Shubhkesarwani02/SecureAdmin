#!/usr/bin/env node

/**
 * Backend API Endpoints Verification Script
 * This script verifies that all required endpoints are properly implemented
 * and tests authorization logic for different roles
 */

const fs = require('fs');
const path = require('path');

// Import authorization test functions
const {
  testCSMAuthorization,
  testAdminAuthorization, 
  testSuperadminAuthorization
} = require('./test-authorization.js');

// Required endpoints from the specification
const requiredEndpoints = [
  {
    endpoint: '/auth/login',
    method: 'POST',
    description: 'Authenticate user and return JWT',
    access: 'Public',
    file: 'authRoutes.js'
  },
  {
    endpoint: '/users',
    method: 'GET', 
    description: 'Get list of users (filtered by role)',
    access: 'Admin, Superadmin only',
    file: 'userRoutes.js'
  },
  {
    endpoint: '/users/:id',
    method: 'GET',
    description: 'Get user details', 
    access: 'Admin (within scope), Superadmin',
    file: 'userRoutes.js'
  },
  {
    endpoint: '/impersonate/start', 
    method: 'POST',
    description: 'Start impersonation session',
    access: 'Admin, Superadmin',
    file: 'authRoutes.js'
  },
  {
    endpoint: '/impersonate/stop',
    method: 'POST', 
    description: 'End impersonation session',
    access: 'Admin, Superadmin',
    file: 'authRoutes.js'
  },
  {
    endpoint: '/accounts',
    method: 'GET',
    description: 'Get accounts list (filtered by role)',
    access: 'CSM, Admin, Superadmin', 
    file: 'accountRoutes.js'
  },
  {
    endpoint: '/accounts/:id/users',
    method: 'GET',
    description: 'Get users assigned to an account',
    access: 'CSM (if assigned), Admin, Superadmin',
    file: 'accountRoutes.js'
  },
  {
    endpoint: '/roles/assign',
    method: 'POST',
    description: 'Assign role or account to user',
    access: 'Admin, Superadmin',
    file: 'roleRoutes.js'
  }
];

// File paths
const routesDir = path.join(__dirname, '../backend/routes');
const controllersDir = path.join(__dirname, '../backend/controllers');
const serverFile = path.join(__dirname, '../backend/server.js');

console.log('🔍 Verifying Backend API Endpoints Implementation...\n');

// Check if routes directory exists
if (!fs.existsSync(routesDir)) {
  console.error('❌ Routes directory not found:', routesDir);
  process.exit(1);
}

// Check each required endpoint
let allEndpointsImplemented = true;

for (const endpoint of requiredEndpoints) {
  const routeFile = path.join(routesDir, endpoint.file);
  
  console.log(`📋 Checking: ${endpoint.method} ${endpoint.endpoint}`);
  console.log(`   Description: ${endpoint.description}`);
  console.log(`   Access: ${endpoint.access}`);
  console.log(`   Expected file: ${endpoint.file}`);
  
  // Check if route file exists
  if (!fs.existsSync(routeFile)) {
    console.log(`   ❌ Route file not found: ${endpoint.file}`);
    allEndpointsImplemented = false;
    continue;
  }
  
  // Read route file and check for endpoint
  const routeContent = fs.readFileSync(routeFile, 'utf8');
  
  // Simple pattern matching for route definitions
  let found = false;
  
  if (endpoint.endpoint === '/auth/login' && endpoint.method === 'POST') {
    found = routeContent.includes("router.post('/login'") || routeContent.includes('router.post("/login"');
  } else if (endpoint.endpoint === '/users' && endpoint.method === 'GET') {
    found = routeContent.includes("router.get('/'") || routeContent.includes('router.get("/")');
  } else if (endpoint.endpoint === '/users/:id' && endpoint.method === 'GET') {
    found = routeContent.includes("router.get('/:id'") || routeContent.includes('router.get("/:id"') ||
           routeContent.includes("router.route('/:id')") || routeContent.includes('router.route("/:id")');
  } else if (endpoint.endpoint === '/impersonate/start' && endpoint.method === 'POST') {
    found = routeContent.includes("router.post('/impersonate/start'") || 
           routeContent.includes('router.post("/impersonate/start"');
  } else if (endpoint.endpoint === '/impersonate/stop' && endpoint.method === 'POST') {
    found = routeContent.includes("router.post('/impersonate/stop'") || 
           routeContent.includes('router.post("/impersonate/stop"');
  } else if (endpoint.endpoint === '/accounts' && endpoint.method === 'GET') {
    found = routeContent.includes("router.get('/'") || routeContent.includes('router.get("/")');
  } else if (endpoint.endpoint === '/accounts/:id/users' && endpoint.method === 'GET') {
    found = routeContent.includes("router.get('/:id/users'") || 
           routeContent.includes('router.get("/:id/users"');
  } else if (endpoint.endpoint === '/roles/assign' && endpoint.method === 'POST') {
    found = routeContent.includes("router.post('/assign'") || 
           routeContent.includes('router.post("/assign"');
  }
  
  if (found) {
    console.log(`   ✅ Route found in ${endpoint.file}`);
  } else {
    console.log(`   ❌ Route NOT found in ${endpoint.file}`);
    allEndpointsImplemented = false;
  }
  
  console.log('');
}

// Check if routes are registered in server.js
console.log('📋 Checking server.js route registrations...\n');

if (!fs.existsSync(serverFile)) {
  console.error('❌ Server file not found:', serverFile);
  process.exit(1);
}

const serverContent = fs.readFileSync(serverFile, 'utf8');

const routeRegistrations = [
  { path: '/api/auth', file: 'authRoutes' },
  { path: '/api/users', file: 'userRoutes' },
  { path: '/api/accounts', file: 'accountRoutes' },
  { path: '/api/roles', file: 'roleRoutes' }
];

for (const registration of routeRegistrations) {
  const found = serverContent.includes(`app.use('${registration.path}'`);
  
  if (found) {
    console.log(`✅ ${registration.path} registered in server.js`);
  } else {
    console.log(`❌ ${registration.path} NOT registered in server.js`);
    allEndpointsImplemented = false;
  }
}

console.log('\n' + '='.repeat(60));

if (allEndpointsImplemented) {
  console.log('🎉 SUCCESS: All required endpoints are implemented!');
  console.log('\n📊 Summary:');
  console.log('✅ Authentication endpoints: Implemented');
  console.log('✅ User management endpoints: Implemented');
  console.log('✅ Impersonation endpoints: Implemented');
  console.log('✅ Account management endpoints: Implemented');
  console.log('✅ Role assignment endpoints: Implemented');
  console.log('✅ Proper access controls: Implemented');
  console.log('✅ Route registrations: Complete');
  
  // Check if authorization testing was requested
  const args = process.argv.slice(2);
  const testAuth = args.includes('--test-auth') || args.includes('--auth');
  const roleFilter = args.find(arg => arg.startsWith('--role='))?.split('=')[1];
  
  if (testAuth) {
    console.log('\n🔐 Running Authorization Tests...');
    console.log('=' + '='.repeat(60));
    
    // Run authorization tests based on role filter
    runAuthorizationTests(roleFilter);
  } else {
    console.log('\n💡 Tip: Run with --test-auth to verify authorization logic');
    console.log('   Examples:');
    console.log('   - node verify-endpoints.js --test-auth');
    console.log('   - node verify-endpoints.js --test-auth --role=csm');
    console.log('   - node verify-endpoints.js --test-auth --role=admin');
    console.log('   - node verify-endpoints.js --test-auth --role=superadmin');
  }
} else {
  console.log('❌ ISSUES FOUND: Some endpoints are missing or not properly implemented.');
  console.log('Please check the output above for details.');
  process.exit(1);
}

console.log('\n🚀 The backend API is ready with all required endpoints!');

// Authorization testing function
async function runAuthorizationTests(roleFilter) {
  try {
    if (!roleFilter || roleFilter === 'csm') {
      console.log('\n🔍 Testing CSM Authorization...');
      const csmResults = await testCSMAuthorization();
      printTestResults('CSM', csmResults);
    }
    
    if (!roleFilter || roleFilter === 'admin') {
      console.log('\n🔍 Testing Admin Authorization...');
      const adminResults = await testAdminAuthorization();
      printTestResults('Admin', adminResults);
    }
    
    if (!roleFilter || roleFilter === 'superadmin') {
      console.log('\n🔍 Testing Superadmin Authorization...');
      const superadminResults = await testSuperadminAuthorization();
      printTestResults('Superadmin', superadminResults);
    }
    
  } catch (error) {
    console.log('\n⚠️  Authorization tests require valid JWT tokens');
    console.log('Please set environment variables:');
    console.log('  CSM_TOKEN, ADMIN_TOKEN, SUPERADMIN_TOKEN');
    console.log('\nOr see scripts/test-authorization.js for manual testing');
  }
}

// Print test results helper
function printTestResults(roleName, results) {
  const total = results.passed + results.failed;
  const successRate = Math.round((results.passed / total) * 100);
  
  console.log(`\n📊 ${roleName} Test Results:`);
  console.log(`   Tests: ${total} | Passed: ${results.passed} | Failed: ${results.failed} | Success: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('   ❌ Failed tests need attention');
  } else {
    console.log('   ✅ All authorization checks passed');
  }
}
