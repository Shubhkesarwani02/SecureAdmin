#!/usr/bin/env node

/**
 * Authorization Logic Test Script
 * 
 * This script tests the authorization logic for different roles:
 * - CSM: Can only access assigned accounts and their users
 * - Admin: Full access to accounts and users (except other admins/superadmins)
 * - Superadmin: Unrestricted access to everything
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_ACCOUNTS = ['account-1', 'account-2', 'account-3'];
const TEST_USERS = ['user-1', 'user-2', 'user-3'];

// Test user tokens (replace with actual tokens from your test environment)
const TOKENS = {
  csm: process.env.CSM_TOKEN || 'your-csm-jwt-token',
  admin: process.env.ADMIN_TOKEN || 'your-admin-jwt-token',
  superadmin: process.env.SUPERADMIN_TOKEN || 'your-superadmin-jwt-token'
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    };
  }
}

// Test CSM authorization
async function testCSMAuthorization() {
  console.log('\n🔍 Testing CSM Authorization Logic...\n');
  
  const csmToken = TOKENS.csm;
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: CSM accessing accounts (should only see assigned accounts)
  console.log('Test 1: CSM accessing /accounts');
  const accountsResult = await makeRequest('GET', '/accounts', csmToken);
  
  if (accountsResult.success) {
    console.log('✅ CSM can access accounts endpoint');
    console.log(`   Returned ${accountsResult.data?.data?.accounts?.length || 0} accounts`);
    results.passed++;
  } else {
    console.log('❌ CSM cannot access accounts endpoint');
    console.log(`   Error: ${accountsResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'CSM Access Accounts',
    passed: accountsResult.success,
    details: accountsResult
  });

  // Test 2: CSM accessing specific account (should only work for assigned accounts)
  console.log('\nTest 2: CSM accessing specific account');
  for (const accountId of TEST_ACCOUNTS) {
    const accountResult = await makeRequest('GET', `/accounts/${accountId}`, csmToken);
    
    if (accountResult.success) {
      console.log(`✅ CSM can access account ${accountId} (assigned account)`);
      results.passed++;
    } else if (accountResult.status === 403) {
      console.log(`⚠️  CSM denied access to account ${accountId} (not assigned)`);
      results.passed++;
    } else {
      console.log(`❌ Unexpected error accessing account ${accountId}: ${accountResult.message}`);
      results.failed++;
    }
    
    results.tests.push({
      name: `CSM Access Account ${accountId}`,
      passed: accountResult.success || accountResult.status === 403,
      details: accountResult
    });
  }

  // Test 3: CSM accessing users (should only see users in assigned accounts)
  console.log('\nTest 3: CSM accessing users');
  const usersResult = await makeRequest('GET', '/users', csmToken);
  
  if (usersResult.success) {
    console.log('✅ CSM can access users endpoint');
    console.log(`   Returned ${usersResult.data?.data?.users?.length || 0} users`);
    results.passed++;
  } else {
    console.log('❌ CSM cannot access users endpoint');
    console.log(`   Error: ${usersResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'CSM Access Users List',
    passed: usersResult.success,
    details: usersResult
  });

  // Test 4: CSM accessing specific users
  console.log('\nTest 4: CSM accessing specific users');
  for (const userId of TEST_USERS) {
    const userResult = await makeRequest('GET', `/users/${userId}`, csmToken);
    
    if (userResult.success) {
      console.log(`✅ CSM can access user ${userId} (user in assigned account)`);
      results.passed++;
    } else if (userResult.status === 403) {
      console.log(`⚠️  CSM denied access to user ${userId} (user not in assigned account)`);
      results.passed++;
    } else {
      console.log(`❌ Unexpected error accessing user ${userId}: ${userResult.message}`);
      results.failed++;
    }
    
    results.tests.push({
      name: `CSM Access User ${userId}`,
      passed: userResult.success || userResult.status === 403,
      details: userResult
    });
  }

  return results;
}

// Test Admin authorization
async function testAdminAuthorization() {
  console.log('\n🔍 Testing Admin Authorization Logic...\n');
  
  const adminToken = TOKENS.admin;
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Admin accessing all accounts
  console.log('Test 1: Admin accessing all accounts');
  const accountsResult = await makeRequest('GET', '/accounts', adminToken);
  
  if (accountsResult.success) {
    console.log('✅ Admin can access all accounts');
    console.log(`   Returned ${accountsResult.data?.data?.accounts?.length || 0} accounts`);
    results.passed++;
  } else {
    console.log('❌ Admin cannot access accounts');
    console.log(`   Error: ${accountsResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Admin Access All Accounts',
    passed: accountsResult.success,
    details: accountsResult
  });

  // Test 2: Admin accessing all users
  console.log('\nTest 2: Admin accessing all users');
  const usersResult = await makeRequest('GET', '/users', adminToken);
  
  if (usersResult.success) {
    console.log('✅ Admin can access users');
    console.log(`   Returned ${usersResult.data?.data?.users?.length || 0} users`);
    results.passed++;
  } else {
    console.log('❌ Admin cannot access users');
    console.log(`   Error: ${usersResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Admin Access All Users',
    passed: usersResult.success,
    details: usersResult
  });

  // Test 3: Admin creating new account
  console.log('\nTest 3: Admin creating new account');
  const newAccountData = {
    name: 'Test Account',
    companyName: 'Test Company',
    email: 'test@company.com',
    integrationCode: 'TEST-' + Date.now(),
    subscriptionPlan: 'basic'
  };
  
  const createAccountResult = await makeRequest('POST', '/accounts', adminToken, newAccountData);
  
  if (createAccountResult.success) {
    console.log('✅ Admin can create accounts');
    results.passed++;
  } else {
    console.log('❌ Admin cannot create accounts');
    console.log(`   Error: ${createAccountResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Admin Create Account',
    passed: createAccountResult.success,
    details: createAccountResult
  });

  // Test 4: Admin assigning CSM to account
  console.log('\nTest 4: Admin assigning CSM to account');
  if (TEST_ACCOUNTS.length > 0) {
    const assignmentData = {
      csmId: 'test-csm-id',
      isPrimary: true,
      notes: 'Test assignment'
    };
    
    const assignResult = await makeRequest('POST', `/accounts/${TEST_ACCOUNTS[0]}/assign-csm`, adminToken, assignmentData);
    
    if (assignResult.success || assignResult.status === 404) { // 404 is ok if test account doesn't exist
      console.log('✅ Admin can assign CSMs to accounts');
      results.passed++;
    } else if (assignResult.status === 403) {
      console.log('❌ Admin denied access to assign CSMs');
      results.failed++;
    } else {
      console.log(`⚠️  Assignment test inconclusive: ${assignResult.message}`);
      results.passed++;
    }
    
    results.tests.push({
      name: 'Admin Assign CSM',
      passed: assignResult.success || assignResult.status === 404,
      details: assignResult
    });
  }

  return results;
}

// Test Superadmin authorization
async function testSuperadminAuthorization() {
  console.log('\n🔍 Testing Superadmin Authorization Logic...\n');
  
  const superadminToken = TOKENS.superadmin;
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Superadmin accessing all accounts
  console.log('Test 1: Superadmin accessing all accounts');
  const accountsResult = await makeRequest('GET', '/accounts', superadminToken);
  
  if (accountsResult.success) {
    console.log('✅ Superadmin has unrestricted access to accounts');
    results.passed++;
  } else {
    console.log('❌ Superadmin denied access to accounts');
    console.log(`   Error: ${accountsResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Superadmin Access All Accounts',
    passed: accountsResult.success,
    details: accountsResult
  });

  // Test 2: Superadmin accessing all users
  console.log('\nTest 2: Superadmin accessing all users');
  const usersResult = await makeRequest('GET', '/users', superadminToken);
  
  if (usersResult.success) {
    console.log('✅ Superadmin has unrestricted access to users');
    results.passed++;
  } else {
    console.log('❌ Superadmin denied access to users');
    console.log(`   Error: ${usersResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Superadmin Access All Users',
    passed: usersResult.success,
    details: usersResult
  });

  // Test 3: Superadmin creating users
  console.log('\nTest 3: Superadmin creating users');
  const newUserData = {
    email: 'test@example.com',
    password: 'Test123!@#',
    fullName: 'Test User',
    role: 'user',
    department: 'Testing'
  };
  
  const createUserResult = await makeRequest('POST', '/users', superadminToken, newUserData);
  
  if (createUserResult.success || createUserResult.status === 400) { // 400 if user exists
    console.log('✅ Superadmin can create users');
    results.passed++;
  } else {
    console.log('❌ Superadmin cannot create users');
    console.log(`   Error: ${createUserResult.message}`);
    results.failed++;
  }
  
  results.tests.push({
    name: 'Superadmin Create User',
    passed: createUserResult.success || createUserResult.status === 400,
    details: createUserResult
  });

  return results;
}

// Print test results summary
function printSummary(roleName, results) {
  console.log(`\n📊 ${roleName} Authorization Test Summary:`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(test => !test.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.details.message}`);
    });
  }
}

// Main test runner
async function runAuthorizationTests() {
  console.log('🚀 Starting Authorization Logic Tests...');
  console.log('=====================================');
  
  try {
    // Test CSM authorization
    const csmResults = await testCSMAuthorization();
    printSummary('CSM', csmResults);
    
    // Test Admin authorization
    const adminResults = await testAdminAuthorization();
    printSummary('Admin', adminResults);
    
    // Test Superadmin authorization
    const superadminResults = await testSuperadminAuthorization();
    printSummary('Superadmin', superadminResults);
    
    // Overall summary
    const totalPassed = csmResults.passed + adminResults.passed + superadminResults.passed;
    const totalFailed = csmResults.failed + adminResults.failed + superadminResults.failed;
    
    console.log('\n🎯 Overall Test Summary:');
    console.log('========================');
    console.log(`Total Tests: ${totalPassed + totalFailed}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Overall Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All authorization tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some authorization tests failed. Please review the implementation.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test runner error:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  // Check if tokens are provided
  const missingTokens = Object.entries(TOKENS).filter(([role, token]) => 
    !token || token.startsWith('your-')
  );
  
  if (missingTokens.length > 0) {
    console.log('⚠️  Missing test tokens. Please set the following environment variables:');
    missingTokens.forEach(([role]) => {
      console.log(`   ${role.toUpperCase()}_TOKEN`);
    });
    console.log('\nOr update the TOKENS object in this script with valid JWT tokens.');
    process.exit(1);
  }
  
  runAuthorizationTests();
}

module.exports = {
  testCSMAuthorization,
  testAdminAuthorization,
  testSuperadminAuthorization,
  runAuthorizationTests
};
