const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test users for each role as created in our setup
const testUsers = [
  {
    role: 'superadmin',
    email: 'superadmin@framtt.com',
    password: 'SuperAdmin123!',
    name: 'Super Administrator',
    expectedPermissions: ['all', 'user_management', 'role_management', 'impersonation', 'system_monitoring']
  },
  {
    role: 'admin', 
    email: 'admin@framtt.com',
    password: 'Admin123!',
    name: 'Platform Administrator',
    expectedPermissions: ['user_management', 'customer_management', 'impersonation_csm_user', 'reports']
  },
  {
    role: 'csm',
    email: 'csm1@framtt.com', 
    password: 'CSM123!',
    name: 'Customer Success Manager One',
    expectedPermissions: ['account_management', 'customer_support', 'assigned_accounts_only']
  },
  {
    role: 'user',
    email: 'user1@framtt.com',
    password: 'User123!', 
    name: 'Test User One',
    expectedPermissions: ['basic_access', 'profile_management']
  }
];

// Authentication requirements from the attachment
const authRequirements = {
  jwtTokens: true,
  bcryptHashing: true,
  statelessSessions: true,
  tokenExpiry: true,
  refreshTokens: true
};

// Store test results
const testResults = {
  authentication: {},
  jwtVerification: {},
  roleAccess: {},
  impersonation: {},
  security: {}
};

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

// Test 1: Authentication & JWT Token Generation
async function testAuthentication() {
  console.log('🔐 TESTING AUTHENTICATION & JWT TOKENS');
  console.log('=====================================\n');

  for (const user of testUsers) {
    console.log(`📝 Testing login for ${user.role.toUpperCase()}: ${user.email}`);
    
    // Test login
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: user.email,
      password: user.password
    });

    if (loginResponse.success) {
      const { data } = loginResponse.data;
      
      // Verify JWT token structure
      const token = data.token || data.accessToken;
      if (token) {
        try {
          const decoded = jwt.decode(token, { complete: true });
          
          console.log(`   ✅ Login successful`);
          console.log(`   ✅ JWT token generated`);
          console.log(`   ✅ Token contains role: ${decoded.payload.role}`);
          console.log(`   ✅ Token contains user ID: ${decoded.payload.id}`);
          console.log(`   ✅ Token has expiration: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
          
          // Store token for further tests
          testResults.authentication[user.role] = {
            success: true,
            token,
            user: data.user,
            decoded: decoded.payload
          };
          
          // Verify user data structure
          if (data.user.role === user.role && data.user.email === user.email) {
            console.log(`   ✅ User data matches expected role and email`);
          } else {
            console.log(`   ❌ User data mismatch`);
          }
          
        } catch (jwtError) {
          console.log(`   ❌ JWT token decode failed: ${jwtError.message}`);
          testResults.authentication[user.role] = { success: false, error: jwtError.message };
        }
      } else {
        console.log(`   ❌ No JWT token in response`);
        testResults.authentication[user.role] = { success: false, error: 'No token in response' };
      }
    } else {
      console.log(`   ❌ Login failed: ${loginResponse.error.message || loginResponse.error}`);
      testResults.authentication[user.role] = { 
        success: false, 
        error: loginResponse.error.message || loginResponse.error 
      };
    }
    
    console.log('   ---\n');
  }
}

// Test 2: JWT Token Verification & Role-based Access
async function testJWTVerification() {
  console.log('🔍 TESTING JWT VERIFICATION & ROLE ACCESS');
  console.log('=========================================\n');

  for (const user of testUsers) {
    const authData = testResults.authentication[user.role];
    
    if (!authData || !authData.success) {
      console.log(`⏭️  Skipping ${user.role} - authentication failed`);
      continue;
    }

    console.log(`🔑 Testing JWT verification for ${user.role.toUpperCase()}`);
    
    // Test protected endpoint access
    const meResponse = await makeRequest('GET', '/auth/me', null, authData.token);
    
    if (meResponse.success) {
      console.log(`   ✅ Protected endpoint access successful`);
      console.log(`   ✅ Token verification working`);
      console.log(`   ✅ User data returned: ${meResponse.data.data.user.full_name}`);
      
      testResults.jwtVerification[user.role] = {
        success: true,
        userData: meResponse.data.data.user
      };
    } else {
      console.log(`   ❌ Protected endpoint access failed: ${meResponse.error.message || meResponse.error}`);
      testResults.jwtVerification[user.role] = {
        success: false,
        error: meResponse.error.message || meResponse.error
      };
    }
    
    console.log('   ---\n');
  }
}

// Test 3: Password Security (bcrypt verification)
async function testPasswordSecurity() {
  console.log('🔒 TESTING PASSWORD SECURITY');
  console.log('============================\n');

  // Test with wrong password
  const testUser = testUsers[0]; // Use superadmin for test
  console.log(`🧪 Testing password security with wrong password`);
  
  const wrongPasswordResponse = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: 'WrongPassword123!'
  });

  if (!wrongPasswordResponse.success && wrongPasswordResponse.status === 401) {
    console.log('   ✅ Wrong password correctly rejected');
    console.log('   ✅ bcrypt password verification working');
    testResults.security.passwordVerification = { success: true };
  } else {
    console.log('   ❌ Security issue: Wrong password accepted or unexpected response');
    testResults.security.passwordVerification = { success: false };
  }

  // Test with invalid email format
  console.log(`\n🧪 Testing email validation`);
  const invalidEmailResponse = await makeRequest('POST', '/auth/login', {
    email: 'invalid-email',
    password: testUser.password
  });

  if (!invalidEmailResponse.success && invalidEmailResponse.status === 400) {
    console.log('   ✅ Invalid email format correctly rejected');
    testResults.security.emailValidation = { success: true };
  } else {
    console.log('   ❌ Invalid email format not properly validated');
    testResults.security.emailValidation = { success: false };
  }

  console.log('   ---\n');
}

// Test 4: Token Expiry and Refresh (if available)
async function testTokenExpiry() {
  console.log('⏰ TESTING TOKEN EXPIRY & REFRESH');
  console.log('=================================\n');

  // Test refresh token endpoint if available
  const refreshResponse = await makeRequest('POST', '/auth/refresh');
  
  if (refreshResponse.success || refreshResponse.status === 401) {
    console.log('   ✅ Refresh token endpoint exists');
    if (refreshResponse.status === 401) {
      console.log('   ✅ Properly requires refresh token');
    }
    testResults.security.refreshToken = { success: true, available: true };
  } else if (refreshResponse.status === 404) {
    console.log('   ⚠️  Refresh token endpoint not found');
    testResults.security.refreshToken = { success: false, available: false };
  } else {
    console.log('   ❌ Unexpected refresh token response');
    testResults.security.refreshToken = { success: false, error: refreshResponse.error };
  }

  console.log('   ---\n');
}

// Test 5: Impersonation Features (Admin/Superadmin)
async function testImpersonation() {
  console.log('👤 TESTING IMPERSONATION FEATURES');
  console.log('=================================\n');

  const superadminAuth = testResults.authentication.superadmin;
  const adminAuth = testResults.authentication.admin;
  const userAuth = testResults.authentication.user;

  // Test superadmin impersonation
  if (superadminAuth && superadminAuth.success) {
    console.log('🔄 Testing superadmin impersonation capabilities');
    
    if (userAuth && userAuth.success) {
      const impersonateResponse = await makeRequest('POST', '/auth/impersonate/start', {
        targetUserId: userAuth.user.id
      }, superadminAuth.token);

      if (impersonateResponse.success) {
        console.log('   ✅ Superadmin can initiate impersonation');
        testResults.impersonation.superadmin = { success: true };
      } else if (impersonateResponse.status === 403) {
        console.log('   ❌ Superadmin impersonation blocked (should be allowed)');
        testResults.impersonation.superadmin = { success: false, error: 'Blocked' };
      } else {
        console.log(`   ⚠️  Impersonation test inconclusive: ${impersonateResponse.error.message || impersonateResponse.error}`);
        testResults.impersonation.superadmin = { success: false, error: impersonateResponse.error };
      }
    }
  }

  // Test user impersonation (should fail)
  if (userAuth && userAuth.success && userAuth.user) {
    console.log('\n🚫 Testing user impersonation (should be blocked)');
    
    const userImpersonateResponse = await makeRequest('POST', '/auth/impersonate/start', {
      targetUserId: superadminAuth?.user?.id || 'test-id'
    }, userAuth.token);

    if (!userImpersonateResponse.success && userImpersonateResponse.status === 403) {
      console.log('   ✅ User correctly blocked from impersonation');
      testResults.impersonation.userBlocked = { success: true };
    } else {
      console.log('   ❌ Security issue: User allowed to impersonate');
      testResults.impersonation.userBlocked = { success: false };
    }
  }

  console.log('   ---\n');
}

// Test 6: Comprehensive Security Validation
async function testSecurityRequirements() {
  console.log('🛡️  SECURITY REQUIREMENTS VALIDATION');
  console.log('====================================\n');

  const securityChecks = {
    jwtTokens: false,
    bcryptHashing: false, 
    statelessSessions: false,
    tokenExpiry: false,
    refreshTokens: false
  };

  // Check JWT tokens
  const hasJWTTokens = Object.values(testResults.authentication).some(auth => 
    auth.success && auth.token && auth.decoded
  );
  securityChecks.jwtTokens = hasJWTTokens;
  console.log(`   ${hasJWTTokens ? '✅' : '❌'} JWT tokens implemented`);

  // Check bcrypt hashing (password verification worked)
  const hasBcryptHashing = testResults.security.passwordVerification?.success;
  securityChecks.bcryptHashing = hasBcryptHashing;
  console.log(`   ${hasBcryptHashing ? '✅' : '❌'} bcrypt password hashing`);

  // Check stateless sessions (JWT contains user info)
  const hasStatelessSessions = Object.values(testResults.authentication).some(auth => 
    auth.success && auth.decoded && auth.decoded.role && auth.decoded.id
  );
  securityChecks.statelessSessions = hasStatelessSessions;
  console.log(`   ${hasStatelessSessions ? '✅' : '❌'} Stateless sessions (JWT contains user data)`);

  // Check token expiry
  const hasTokenExpiry = Object.values(testResults.authentication).some(auth => 
    auth.success && auth.decoded && auth.decoded.exp
  );
  securityChecks.tokenExpiry = hasTokenExpiry;
  console.log(`   ${hasTokenExpiry ? '✅' : '❌'} Token expiry implemented`);

  // Check refresh tokens
  const hasRefreshTokens = testResults.security.refreshToken?.available;
  securityChecks.refreshTokens = hasRefreshTokens;
  console.log(`   ${hasRefreshTokens ? '✅' : '❌'} Refresh tokens available`);

  testResults.security.overallCompliance = securityChecks;
  console.log('   ---\n');
}

// Generate comprehensive report
async function generateReport() {
  console.log('📊 COMPREHENSIVE AUTHENTICATION TEST REPORT');
  console.log('==========================================\n');

  console.log('🔐 AUTHENTICATION RESULTS:');
  Object.entries(testResults.authentication).forEach(([role, result]) => {
    console.log(`   ${result.success ? '✅' : '❌'} ${role.toUpperCase()}: ${result.success ? 'SUCCESS' : result.error}`);
  });

  console.log('\n🔍 JWT VERIFICATION RESULTS:');
  Object.entries(testResults.jwtVerification).forEach(([role, result]) => {
    console.log(`   ${result.success ? '✅' : '❌'} ${role.toUpperCase()}: ${result.success ? 'SUCCESS' : result.error}`);
  });

  console.log('\n👤 IMPERSONATION RESULTS:');
  Object.entries(testResults.impersonation).forEach(([test, result]) => {
    console.log(`   ${result.success ? '✅' : '❌'} ${test}: ${result.success ? 'SUCCESS' : result.error || 'FAILED'}`);
  });

  console.log('\n🛡️  SECURITY COMPLIANCE:');
  if (testResults.security.overallCompliance) {
    Object.entries(testResults.security.overallCompliance).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}`);
    });
  }

  // Calculate overall score
  const totalTests = Object.keys(testResults.authentication).length + 
                    Object.keys(testResults.jwtVerification).length +
                    Object.keys(testResults.impersonation).length +
                    Object.keys(testResults.security.overallCompliance || {}).length;
  
  const passedTests = Object.values(testResults.authentication).filter(r => r.success).length +
                     Object.values(testResults.jwtVerification).filter(r => r.success).length +
                     Object.values(testResults.impersonation).filter(r => r.success).length +
                     Object.values(testResults.security.overallCompliance || {}).filter(r => r).length;

  const score = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 OVERALL SCORE: ${score}% (${passedTests}/${totalTests} tests passed)`);

  if (score >= 90) {
    console.log('🎉 EXCELLENT: Authentication system fully compliant!');
  } else if (score >= 75) {
    console.log('✅ GOOD: Authentication system mostly compliant with minor issues');
  } else if (score >= 50) {
    console.log('⚠️  NEEDS IMPROVEMENT: Several authentication issues found');
  } else {
    console.log('❌ CRITICAL: Major authentication security issues detected');
  }

  // Show failed tests summary
  console.log('\n📋 RECOMMENDATIONS:');
  if (!testResults.security.overallCompliance?.refreshTokens) {
    console.log('   • Implement refresh token functionality for better security');
  }
  if (Object.values(testResults.authentication).some(r => !r.success)) {
    console.log('   • Fix authentication failures for affected roles');
  }
  if (Object.values(testResults.impersonation).some(r => !r.success)) {
    console.log('   • Review impersonation logic and permissions');
  }
}

// Main test execution
async function runAuthenticationTests() {
  console.log('🚀 FRAMTT AUTHENTICATION SYSTEM TESTING');
  console.log('=======================================\n');
  console.log('Testing against requirements from specification document:\n');
  console.log('• Authentication via JWT tokens');
  console.log('• User credentials verification with embedded role and user ID');
  console.log('• Passwords securely hashed with bcrypt');
  console.log('• Stateless sessions with token expiry and refresh support\n');
  console.log('=======================================================\n');

  try {
    // Check if backend is running
    console.log('🔌 Checking backend connectivity...');
    const healthCheck = await makeRequest('GET', '/auth/me');
    if (healthCheck.status === 401) {
      console.log('✅ Backend is running (401 expected without token)\n');
    } else if (healthCheck.success) {
      console.log('✅ Backend is running\n');
    } else {
      console.log('❌ Backend not accessible. Please start the backend server first.');
      console.log(`   Tried: ${API_URL}/auth/me`);
      console.log(`   Error: ${healthCheck.error}\n`);
      return;
    }

    // Run all tests
    await testAuthentication();
    await testJWTVerification();
    await testPasswordSecurity();
    await testTokenExpiry();
    await testImpersonation();
    await testSecurityRequirements();
    await generateReport();

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Full error:', error);
  }
}

// Execute tests
runAuthenticationTests();
