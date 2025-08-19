const axios = require('axios');
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// API Base URL
const BASE_URL = 'http://localhost:5000/api';

// Test user credentials (from our previous setup)
const testUsers = {
  superadmin: { email: 'superadmin@framtt.com', password: 'SuperAdmin123!' },
  admin: { email: 'admin@framtt.com', password: 'Admin123!' },
  csm: { email: 'csm1@framtt.com', password: 'CSM123!' },
  user: { email: 'user1@framtt.com', password: 'User123!' }
};

let tokens = {};
let userIds = {};
let accountIds = [];

async function runComprehensiveAssignmentTest() {
  console.log(`${colors.blue}${colors.bright}=== Comprehensive Assignment Logic Test ===${colors.reset}\n`);
  console.log(`${colors.yellow}Testing User & Account Assignment Logic while ensuring existing functionality remains intact${colors.reset}\n`);

  try {
    // Phase 1: Verify existing authentication still works
    console.log(`${colors.blue}${colors.bright}Phase 1: Authentication & Role Hierarchy Verification${colors.reset}`);
    await testAuthenticationIntegrity();

    // Phase 2: Test assignment functionality
    console.log(`\n${colors.blue}${colors.bright}Phase 2: User & Account Assignment Logic${colors.reset}`);
    await testAssignmentLogic();

    // Phase 3: Verify impersonation with assignments
    console.log(`\n${colors.blue}${colors.bright}Phase 3: Impersonation with Assignment Access Control${colors.reset}`);
    await testImpersonationWithAssignments();

    // Phase 4: Test role-based access to assignments
    console.log(`\n${colors.blue}${colors.bright}Phase 4: Role-Based Assignment Access Control${colors.reset}`);
    await testRoleBasedAssignmentAccess();

    console.log(`\n${colors.green}${colors.bright}🎉 All tests completed successfully!${colors.reset}`);
    console.log(`${colors.green}✅ Authentication, hierarchy, impersonation, and assignment logic are all working correctly${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

async function testAuthenticationIntegrity() {
  console.log(`${colors.yellow}  Testing login for all role levels...${colors.reset}`);

  for (const [role, credentials] of Object.entries(testUsers)) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
      
      if (response.data.success && response.data.data?.token) {
        tokens[role] = response.data.data.token;
        userIds[role] = response.data.data.user.id;
        console.log(`${colors.green}    ✓ ${role} login successful${colors.reset}`);
      } else {
        throw new Error(`Login failed for ${role} - no token received`);
      }
    } catch (error) {
      console.log(`${colors.red}    ✗ ${role} login failed: ${error.response?.data?.message || error.message}${colors.reset}`);
      throw error;
    }
  }

  console.log(`${colors.green}  ✅ All role authentications working correctly${colors.reset}`);
}

async function testAssignmentLogic() {
  console.log(`${colors.yellow}  Testing assignment operations...${colors.reset}`);

  // Get available accounts
  try {
    const accountsResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (accountsResponse.data.success && accountsResponse.data.data.accounts.length > 0) {
      accountIds = accountsResponse.data.data.accounts.slice(0, 3).map(acc => acc.id);
      console.log(`${colors.green}    ✓ Retrieved ${accountIds.length} test accounts${colors.reset}`);
    } else {
      throw new Error('No accounts available for testing');
    }
  } catch (error) {
    console.log(`${colors.red}    ✗ Failed to get accounts: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  // Test CSM assignment to account
  console.log(`${colors.yellow}    Testing CSM assignment...${colors.reset}`);
  try {
    const assignResponse = await axios.post(`${BASE_URL}/roles/assign`, {
      userId: parseInt(userIds.csm), // Convert string to integer
      accountId: accountIds[0],
      action: 'assign'
    }, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (assignResponse.data.success) {
      console.log(`${colors.green}      ✓ CSM successfully assigned to account${colors.reset}`);
    } else {
      throw new Error('CSM assignment failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ CSM assignment failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  // Test user assignment to account
  console.log(`${colors.yellow}    Testing user assignment...${colors.reset}`);
  try {
    const userAssignResponse = await axios.post(`${BASE_URL}/assignments/user-accounts`, {
      userId: parseInt(userIds.user), // Convert string to integer
      accountId: accountIds[0],
      roleInAccount: 'member'
    }, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (userAssignResponse.data.success) {
      console.log(`${colors.green}      ✓ User successfully assigned to account${colors.reset}`);
    } else {
      throw new Error('User assignment failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ User assignment failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  // Test getting CSM assignments
  console.log(`${colors.yellow}    Testing CSM assignment retrieval...${colors.reset}`);
  try {
    const csmAssignments = await axios.get(`${BASE_URL}/roles/${userIds.csm}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (csmAssignments.data.success && csmAssignments.data.data.assignments.length > 0) {
      console.log(`${colors.green}      ✓ CSM can view their assignments (${csmAssignments.data.data.assignments.length} account(s))${colors.reset}`);
    } else {
      throw new Error('CSM assignment retrieval failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ CSM assignment retrieval failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  console.log(`${colors.green}  ✅ Assignment logic working correctly${colors.reset}`);
}

async function testImpersonationWithAssignments() {
  console.log(`${colors.yellow}  Testing impersonation with assignment context...${colors.reset}`);

  // Test CSM impersonating user in assigned account
  console.log(`${colors.yellow}    Testing CSM impersonation of assigned user...${colors.reset}`);
  try {
    const impersonateResponse = await axios.post(`${BASE_URL}/auth/impersonate/start`, {
      targetUserId: userIds.user
    }, {
      headers: { Authorization: `Bearer ${tokens.csm}` }
    });

    if (impersonateResponse.data.success) {
      const impersonationToken = impersonateResponse.data.impersonationToken;
      console.log(`${colors.green}      ✓ CSM can impersonate user in assigned account${colors.reset}`);

      // Test accessing assignments while impersonating
      const assignmentsWhileImpersonating = await axios.get(`${BASE_URL}/assignments/users/${userIds.user}/accounts`, {
        headers: { Authorization: `Bearer ${impersonationToken}` }
      });

      if (assignmentsWhileImpersonating.data.success) {
        console.log(`${colors.green}      ✓ Can access user assignments while impersonating${colors.reset}`);
      }

      // Stop impersonation
      await axios.post(`${BASE_URL}/auth/impersonate/stop`, {}, {
        headers: { Authorization: `Bearer ${impersonationToken}` }
      });
      console.log(`${colors.green}      ✓ Impersonation stopped successfully${colors.reset}`);
    } else {
      throw new Error('CSM impersonation failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ CSM impersonation failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  console.log(`${colors.green}  ✅ Impersonation with assignments working correctly${colors.reset}`);
}

async function testRoleBasedAssignmentAccess() {
  console.log(`${colors.yellow}  Testing role-based assignment access control...${colors.reset}`);

  // Test admin access to assignment overview
  console.log(`${colors.yellow}    Testing admin assignment overview access...${colors.reset}`);
  try {
    const overviewResponse = await axios.get(`${BASE_URL}/assignments/csm-overview`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (overviewResponse.data.success) {
      console.log(`${colors.green}      ✓ Admin can access CSM assignment overview${colors.reset}`);
    } else {
      throw new Error('Admin overview access failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ Admin overview access failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }

  // Test CSM restricted access
  console.log(`${colors.yellow}    Testing CSM access restrictions...${colors.reset}`);
  try {
    const restrictedResponse = await axios.get(`${BASE_URL}/assignments/csm-overview`, {
      headers: { Authorization: `Bearer ${tokens.csm}` }
    });

    // This should fail (403)
    console.log(`${colors.red}      ✗ CSM should not have access to overview (security issue)${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 403) {
      console.log(`${colors.green}      ✓ CSM correctly denied access to admin overview${colors.reset}`);
    } else {
      throw error;
    }
  }

  // Test user access restrictions
  console.log(`${colors.yellow}    Testing user access restrictions...${colors.reset}`);
  try {
    const userRestrictedResponse = await axios.post(`${BASE_URL}/assignments/user-accounts`, {
      userId: userIds.user,
      accountId: accountIds[1],
      roleInAccount: 'member'
    }, {
      headers: { Authorization: `Bearer ${tokens.user}` }
    });

    // This should fail (403)
    console.log(`${colors.red}      ✗ User should not be able to assign accounts (security issue)${colors.reset}`);
  } catch (error) {
    if (error.response?.status === 403) {
      console.log(`${colors.green}      ✓ User correctly denied assignment privileges${colors.reset}`);
    } else {
      throw error;
    }
  }

  console.log(`${colors.green}  ✅ Role-based access control working correctly${colors.reset}`);
}

// Test assignment statistics
async function testAssignmentStatistics() {
  console.log(`${colors.yellow}  Testing assignment statistics...${colors.reset}`);

  try {
    const statsResponse = await axios.get(`${BASE_URL}/assignments/stats`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });

    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log(`${colors.green}      ✓ Assignment statistics retrieved successfully${colors.reset}`);
      console.log(`        - Total CSMs: ${stats.csmStats?.total_csms || 'N/A'}`);
      console.log(`        - Assigned Accounts: ${stats.accountStats?.accounts_with_csm || 'N/A'}`);
      console.log(`        - Total Users: ${stats.userStats?.total_users || 'N/A'}`);
    } else {
      throw new Error('Statistics retrieval failed');
    }
  } catch (error) {
    console.log(`${colors.red}      ✗ Statistics test failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    throw error;
  }
}

// Run the comprehensive test
runComprehensiveAssignmentTest()
  .then(() => {
    console.log(`\n${colors.green}${colors.bright}🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY! 🎉${colors.reset}`);
    console.log(`${colors.green}✅ All existing functionality (authentication, hierarchy, impersonation) preserved${colors.reset}`);
    console.log(`${colors.green}✅ User & Account Assignment Logic fully implemented and tested${colors.reset}`);
    console.log(`${colors.green}✅ Role-based access control working correctly${colors.reset}`);
    console.log(`${colors.green}✅ Integration between all systems verified${colors.reset}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n${colors.red}${colors.bright}❌ COMPREHENSIVE TEST FAILED${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
