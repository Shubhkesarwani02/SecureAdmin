#!/usr/bin/env node

/**
 * 🔍 API ENDPOINTS VERIFICATION SCRIPT
 * ===================================
 * 
 * This script verifies that all required backend API endpoints are properly implemented
 * with correct access controls as specified in the requirements.
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
  section: '\x1b[1m\x1b[35m%s\x1b[0m'
};

// Required endpoints from specification
const REQUIRED_ENDPOINTS = [
  {
    endpoint: '/auth/login',
    method: 'POST',
    description: 'Authenticate user and return JWT',
    accessControl: 'Public',
    routeFile: 'authRoutes.js',
    pattern: /router\.post\(['"]\/login['"].*login/
  },
  {
    endpoint: '/users',
    method: 'GET',
    description: 'Get list of users (filtered by role)',
    accessControl: 'Admin, Superadmin only',
    routeFile: 'userRoutes.js',
    pattern: /router\.get\(['"]\/['"].*getUsers/
  },
  {
    endpoint: '/users/:id',
    method: 'GET',
    description: 'Get user details',
    accessControl: 'Admin (within scope), Superadmin',
    routeFile: 'userRoutes.js',
    pattern: /router\..*get.*getUser/
  },
  {
    endpoint: '/impersonate/start',
    method: 'POST',
    description: 'Start impersonation session',
    accessControl: 'Admin, Superadmin',
    routeFile: 'authRoutes.js',
    pattern: /router\.post\(['"]\/impersonate\/start['"].*startImpersonation/
  },
  {
    endpoint: '/impersonate/stop',
    method: 'POST',
    description: 'End impersonation session',
    accessControl: 'Admin, Superadmin',
    routeFile: 'authRoutes.js',
    pattern: /router\.post\(['"]\/impersonate\/stop['"].*stopImpersonation/
  },
  {
    endpoint: '/accounts',
    method: 'GET',
    description: 'Get accounts list (filtered by role)',
    accessControl: 'CSM, Admin, Superadmin',
    routeFile: 'accountRoutes.js',
    pattern: /router\.get\(['"]\/['"].*getAccounts/
  },
  {
    endpoint: '/accounts/:id/users',
    method: 'GET',
    description: 'Get users assigned to an account',
    accessControl: 'CSM (if assigned), Admin, Superadmin',
    routeFile: 'accountRoutes.js',
    pattern: /router\.get\(['"]\/.*\/users['"].*getAccountUsers/
  },
  {
    endpoint: '/roles/assign',
    method: 'POST',
    description: 'Assign role or account to user',
    accessControl: 'Admin, Superadmin',
    routeFile: 'roleRoutes.js',
    pattern: /router\.post\(['"]\/assign['"].*assignRole/
  }
];

// Access control middleware mappings
const ACCESS_CONTROL_PATTERNS = {
  'Public': [],
  'Admin, Superadmin only': [/requireAdmin/, /requireSuperAdmin/],
  'Admin, Superadmin': [/requireAdmin/, /requireSuperAdmin/, /canImpersonate/],
  'CSM, Admin, Superadmin': [/requireCSMOrAbove/],
  'Admin (within scope), Superadmin': [/checkCSMUserAccess/, /canManageUser/],
  'CSM (if assigned), Admin, Superadmin': [/checkAccountAccess/, /requireCSMOrAbove/]
};

/**
 * Read and analyze a route file
 */
function analyzeRouteFile(filename) {
  const filePath = path.join(__dirname, 'backend', 'routes', filename);
  
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
 * Check if endpoint is implemented in route file
 */
function checkEndpointImplementation(endpoint, routeContent) {
  if (!routeContent) return false;
  
  return endpoint.pattern.test(routeContent);
}

/**
 * Check if proper access controls are implemented
 */
function checkAccessControls(endpoint, routeContent) {
  if (!routeContent) return { valid: false, details: 'Route file not found' };
  
  const requiredPatterns = ACCESS_CONTROL_PATTERNS[endpoint.accessControl] || [];
  
  // For public endpoints, no access control needed
  if (requiredPatterns.length === 0) {
    return { valid: true, details: 'Public endpoint - no access control required' };
  }
  
  // Check if at least one required pattern is found
  const foundPatterns = requiredPatterns.filter(pattern => pattern.test(routeContent));
  
  if (foundPatterns.length > 0) {
    return { 
      valid: true, 
      details: `Found ${foundPatterns.length} access control middleware(s)` 
    };
  }
  
  return { 
    valid: false, 
    details: `Missing required access control patterns: ${requiredPatterns.map(p => p.source).join(', ')}` 
  };
}

/**
 * Main verification function
 */
function verifyAPIEndpoints() {
  console.log(styles.header, '🔍 BACKEND API ENDPOINTS VERIFICATION');
  console.log(styles.header, '=====================================\n');
  
  let totalEndpoints = 0;
  let implementedEndpoints = 0;
  let accessControlIssues = 0;
  
  const results = [];
  
  for (const endpoint of REQUIRED_ENDPOINTS) {
    totalEndpoints++;
    
    console.log(styles.section, `📋 Verifying: ${endpoint.method} ${endpoint.endpoint}`);
    console.log('  Description:', endpoint.description);
    console.log('  Access Control:', endpoint.accessControl);
    console.log('  Expected File:', endpoint.routeFile);
    
    // Read route file
    const routeContent = analyzeRouteFile(endpoint.routeFile);
    
    // Check implementation
    const isImplemented = checkEndpointImplementation(endpoint, routeContent);
    
    if (isImplemented) {
      console.log(styles.success, '  Implementation: Found');
      implementedEndpoints++;
      
      // Check access controls
      const accessControl = checkAccessControls(endpoint, routeContent);
      
      if (accessControl.valid) {
        console.log(styles.success, `  Access Control: ${accessControl.details}`);
      } else {
        console.log(styles.error, `  Access Control: ${accessControl.details}`);
        accessControlIssues++;
      }
    } else {
      console.log(styles.error, '  Implementation: NOT FOUND');
    }
    
    results.push({
      endpoint: `${endpoint.method} ${endpoint.endpoint}`,
      implemented: isImplemented,
      accessControl: isImplemented ? checkAccessControls(endpoint, routeContent) : { valid: false, details: 'Not implemented' },
      description: endpoint.description,
      file: endpoint.routeFile
    });
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log(styles.header, '📊 VERIFICATION SUMMARY');
  console.log(styles.header, '======================');
  
  console.log(styles.info, `Total Required Endpoints: ${totalEndpoints}`);
  console.log(styles.success, `Implemented Endpoints: ${implementedEndpoints}`);
  console.log(styles.warning, `Access Control Issues: ${accessControlIssues}`);
  
  if (implementedEndpoints === totalEndpoints && accessControlIssues === 0) {
    console.log(styles.success, '\n🎉 ALL API ENDPOINTS FULLY COMPLIANT!');
    console.log(styles.success, '✅ All required endpoints are implemented');
    console.log(styles.success, '✅ All access controls are properly configured');
  } else {
    console.log(styles.warning, '\n⚠️  ISSUES FOUND:');
    
    if (implementedEndpoints < totalEndpoints) {
      console.log(styles.error, `❌ ${totalEndpoints - implementedEndpoints} endpoints not implemented`);
    }
    
    if (accessControlIssues > 0) {
      console.log(styles.error, `❌ ${accessControlIssues} access control issues`);
    }
  }
  
  // Detailed results table
  console.log(styles.header, '\n📋 DETAILED RESULTS');
  console.log(styles.header, '==================');
  
  results.forEach(result => {
    const status = result.implemented && result.accessControl.valid ? '✅' : '❌';
    console.log(`${status} ${result.endpoint}`);
    console.log(`   📄 File: ${result.file}`);
    console.log(`   📝 Description: ${result.description}`);
    console.log(`   🔐 Access Control: ${result.accessControl.details}`);
    console.log('');
  });
  
  return {
    total: totalEndpoints,
    implemented: implementedEndpoints,
    accessControlIssues: accessControlIssues,
    compliant: implementedEndpoints === totalEndpoints && accessControlIssues === 0
  };
}

// Run verification
if (require.main === module) {
  const result = verifyAPIEndpoints();
  process.exit(result.compliant ? 0 : 1);
}

module.exports = { verifyAPIEndpoints };
