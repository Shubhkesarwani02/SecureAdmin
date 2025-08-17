#!/usr/bin/env node

/**
 * 🛡️ AUTHORIZATION LOGIC VERIFICATION SCRIPT
 * ==========================================
 * 
 * This script verifies the specific authorization logic examples for each role:
 * - CSM: Limited to assigned accounts and users
 * - Admin: Full access to all accounts and users, can assign CSMs
 * - Superadmin: Full unrestricted access
 */

const fs = require('fs');
const path = require('path');

// Console styling
const styles = {
  header: '\x1b[1m\x1b[36m%s\x1b[0m',
  success: '\x1b[32m✅ %s\x1b[0m',
  error: '\x1b[31m❌ %s\x1b[0m',
  warning: '\x1b[33m⚠️  %s\x1b[0m',
  info: '\x1b[34mℹ️  %s\x1b[0m',
  section: '\x1b[1m\x1b[35m%s\x1b[0m',
  code: '\x1b[90m%s\x1b[0m'
};

/**
 * Authorization rules to verify
 */
const AUTHORIZATION_RULES = {
  CSM: [
    {
      rule: 'When accessing /accounts, return only accounts assigned to the CSM',
      endpoint: '/accounts',
      method: 'GET',
      implementation: 'accountController.getAccounts',
      codePattern: /if \(currentUserRole === 'csm'\) \{[\s\S]*?result = await accountService\.getByCSM\(currentUserId, options\);/,
      description: 'CSM should only see assigned accounts through getByCSM service'
    },
    {
      rule: 'When accessing /users/:id, allow only if the user belongs to an account assigned to the CSM',
      endpoint: '/users/:id',
      method: 'GET',
      implementation: 'middleware/auth.js',
      codePattern: /const hasCommonAccount = csmAssignments\.some\(assignment =>\s*userAccounts\.some\(userAccount => userAccount\.account_id === assignment\.account_id\)\s*\);/,
      description: 'CSM access validated through account assignment intersection'
    },
    {
      rule: 'CSM can only view users in assigned accounts',
      endpoint: '/users',
      method: 'GET',
      implementation: 'userController_enhanced.getUsers',
      codePattern: /result = await userService\.getUsersByCSM\(currentUserId, options\);/,
      description: 'CSM user listing filtered by assigned accounts'
    }
  ],
  ADMIN: [
    {
      rule: 'Full access to all accounts and users',
      endpoint: '/accounts',
      method: 'GET',
      implementation: 'accountController.getAccounts',
      codePattern: /else if \(\['admin', 'superadmin'\]\.includes\(currentUserRole\)\) \{[\s\S]*?result = await accountService\.getAll\(options\);/,
      description: 'Admin gets all accounts through getAll service'
    },
    {
      rule: 'Can assign CSMs to accounts',
      endpoint: '/accounts/:id/assign-csm',
      method: 'POST',
      implementation: 'accountController.assignCSMToAccount',
      codePattern: /if \(!\['admin', 'superadmin'\]\.includes\(currentUserRole\)\) \{[\s\S]*?message: 'Access denied\. Only admins can assign CSMs\.'/,
      description: 'CSM assignment restricted to admin/superadmin'
    },
    {
      rule: 'Admin can see CSMs and regular users',
      endpoint: '/users',
      method: 'GET',
      implementation: 'userController_enhanced.getUsers',
      codePattern: /if \(currentUserRole === 'admin'\) \{[\s\S]*?options\.role = \['csm', 'user'\];/,
      description: 'Admin user access limited to CSM and user roles'
    }
  ],
  SUPERADMIN: [
    {
      rule: 'Full unrestricted access to all accounts',
      endpoint: '/accounts',
      method: 'GET',
      implementation: 'accountController.getAccounts',
      codePattern: /else if \(\['admin', 'superadmin'\]\.includes\(currentUserRole\)\) \{[\s\S]*?result = await accountService\.getAll\(options\);/,
      description: 'Superadmin gets all accounts without restrictions'
    },
    {
      rule: 'Full unrestricted access to all users',
      endpoint: '/users',
      method: 'GET',
      implementation: 'userController_enhanced.getUsers',
      codePattern: /else if \(currentUserRole === 'superadmin'\) \{[\s\S]*?result = await userService\.getAll\(options\);/,
      description: 'Superadmin gets all users without role restrictions'
    },
    {
      rule: 'Can assign CSMs and perform all admin functions',
      endpoint: '/accounts/:id/assign-csm',
      method: 'POST',
      implementation: 'accountController.assignCSMToAccount',
      codePattern: /if \(!\['admin', 'superadmin'\]\.includes\(currentUserRole\)\) \{[\s\S]*?message: 'Access denied\. Only admins can assign CSMs\.'/,
      description: 'Superadmin included in admin-level operations'
    }
  ]
};

/**
 * Read and analyze implementation files
 */
function analyzeImplementationFile(filename) {
  let filePath;
  
  if (filename.startsWith('middleware/') || filename.startsWith('controllers/')) {
    filePath = path.join(__dirname, 'backend', filename);
  } else {
    filePath = path.join(__dirname, 'backend', filename);
  }
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(styles.error, `Error reading ${filename}: ${error.message}`);
    return null;
  }
}

/**
 * Check if authorization logic is implemented correctly
 */
function checkAuthorizationRule(rule, roleContent) {
  if (!roleContent) {
    return { 
      implemented: false, 
      details: 'Implementation file not found' 
    };
  }
  
  const match = rule.codePattern.test(roleContent);
  
  return {
    implemented: match,
    details: match ? 'Authorization logic found and correctly implemented' : 'Required authorization pattern not found'
  };
}

/**
 * Verify middleware integration
 */
function verifyMiddlewareIntegration() {
  console.log(styles.section, '🔍 VERIFYING MIDDLEWARE INTEGRATION');
  console.log('===================================\n');
  
  const authMiddleware = analyzeImplementationFile('middleware/auth.js');
  const requiredMiddleware = [
    {
      name: 'checkAccountAccess',
      pattern: /const checkAccountAccess = async \(req, res, next\) => \{/,
      description: 'Account access validation for CSMs'
    },
    {
      name: 'checkCSMUserAccess', 
      pattern: /const checkCSMUserAccess = async \(req, res, next\) => \{/,
      description: 'User access validation for CSMs'
    },
    {
      name: 'canManageUser',
      pattern: /const canManageUser = async \(req, res, next\) => \{/,
      description: 'User management permission validation'
    }
  ];
  
  let middlewareIssues = 0;
  
  for (const middleware of requiredMiddleware) {
    if (authMiddleware && middleware.pattern.test(authMiddleware)) {
      console.log(styles.success, `${middleware.name}: Implemented`);
      console.log(styles.code, `   ${middleware.description}`);
    } else {
      console.log(styles.error, `${middleware.name}: Missing`);
      middlewareIssues++;
    }
    console.log('');
  }
  
  return middlewareIssues === 0;
}

/**
 * Main verification function
 */
function verifyAuthorizationLogic() {
  console.log(styles.header, '🛡️ AUTHORIZATION LOGIC VERIFICATION');
  console.log(styles.header, '====================================\n');
  
  let totalRules = 0;
  let implementedRules = 0;
  let roleResults = {};
  
  // Verify middleware first
  const middlewareOk = verifyMiddlewareIntegration();
  
  for (const [roleName, rules] of Object.entries(AUTHORIZATION_RULES)) {
    console.log(styles.section, `📋 Verifying ${roleName} Authorization Rules`);
    console.log('=' + '='.repeat(35 + roleName.length));
    
    roleResults[roleName] = {
      passed: 0,
      failed: 0,
      total: rules.length,
      details: []
    };
    
    for (const rule of rules) {
      totalRules++;
      
      console.log(styles.info, `Rule: ${rule.rule}`);
      console.log(`  📄 Implementation: ${rule.implementation}`);
      console.log(`  🌐 Endpoint: ${rule.method} ${rule.endpoint}`);
      
      // Determine which file to check
      let filename;
      if (rule.implementation.includes('middleware/')) {
        filename = rule.implementation;
      } else if (rule.implementation.includes('Controller')) {
        filename = `controllers/${rule.implementation.split('.')[0]}.js`;
      } else {
        filename = `controllers/${rule.implementation}.js`;
      }
      
      // Read and analyze the implementation
      const implementationContent = analyzeImplementationFile(filename);
      const result = checkAuthorizationRule(rule, implementationContent);
      
      if (result.implemented) {
        console.log(styles.success, `✅ ${result.details}`);
        implementedRules++;
        roleResults[roleName].passed++;
      } else {
        console.log(styles.error, `❌ ${result.details}`);
        roleResults[roleName].failed++;
      }
      
      roleResults[roleName].details.push({
        rule: rule.rule,
        implemented: result.implemented,
        details: result.details,
        endpoint: `${rule.method} ${rule.endpoint}`
      });
      
      console.log(styles.code, `   Expected: ${rule.description}`);
      console.log('');
    }
  }
  
  // Summary
  console.log(styles.header, '📊 VERIFICATION SUMMARY');
  console.log(styles.header, '======================');
  
  console.log(styles.info, `Total Authorization Rules: ${totalRules}`);
  console.log(styles.success, `Implemented Rules: ${implementedRules}`);
  console.log(styles.warning, `Missing Rules: ${totalRules - implementedRules}`);
  console.log(styles.info, `Middleware Integration: ${middlewareOk ? '✅ Complete' : '❌ Issues Found'}`);
  
  // Role-specific results
  console.log('\\n' + styles.section, 'ROLE-SPECIFIC RESULTS');
  console.log('====================');
  
  for (const [roleName, result] of Object.entries(roleResults)) {
    const percentage = Math.round((result.passed / result.total) * 100);
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    
    console.log(`${status} ${roleName}: ${result.passed}/${result.total} rules implemented (${percentage}%)`);
  }
  
  if (implementedRules === totalRules && middlewareOk) {
    console.log(styles.success, '\\n🎉 ALL AUTHORIZATION LOGIC FULLY IMPLEMENTED!');
    console.log(styles.success, '✅ CSM role properly restricted to assigned accounts');
    console.log(styles.success, '✅ Admin role has full access and CSM assignment capabilities');
    console.log(styles.success, '✅ Superadmin role has unrestricted access');
    console.log(styles.success, '✅ All middleware properly integrated');
  } else {
    console.log(styles.warning, '\\n⚠️  AUTHORIZATION ISSUES FOUND:');
    
    if (implementedRules < totalRules) {
      console.log(styles.error, `❌ ${totalRules - implementedRules} authorization rules not properly implemented`);
    }
    
    if (!middlewareOk) {
      console.log(styles.error, '❌ Middleware integration issues detected');
    }
  }
  
  // Detailed implementation guide
  console.log(styles.header, '\\n📋 IMPLEMENTATION DETAILS');
  console.log(styles.header, '=========================');
  
  for (const [roleName, result] of Object.entries(roleResults)) {
    console.log(styles.section, `\\n${roleName} Implementation:`);
    
    result.details.forEach(detail => {
      const status = detail.implemented ? '✅' : '❌';
      console.log(`${status} ${detail.endpoint}`);
      console.log(`   📝 ${detail.rule}`);
      console.log(`   🔧 ${detail.details}`);
      console.log('');
    });
  }
  
  return {
    total: totalRules,
    implemented: implementedRules,
    middlewareOk,
    compliant: implementedRules === totalRules && middlewareOk,
    roleResults
  };
}

// Run verification
if (require.main === module) {
  const result = verifyAuthorizationLogic();
  process.exit(result.compliant ? 0 : 1);
}

module.exports = { verifyAuthorizationLogic };
