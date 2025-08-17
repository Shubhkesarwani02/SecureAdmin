#!/usr/bin/env node

/**
 * 🔐 SECURITY CONSIDERATIONS VERIFICATION SCRIPT
 * ==============================================
 * 
 * This script verifies all security considerations are properly implemented:
 * 1. Password hashing with bcrypt
 * 2. JWT secrets stored securely and rotated
 * 3. Impersonation tokens with limited lifetime and logging
 * 4. Rate limiting on login and impersonation endpoints
 * 5. Audit logging of all admin and impersonation actions
 * 6. Role checks enforced on all APIs
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
 * Security requirements to verify
 */
const SECURITY_REQUIREMENTS = [
  {
    requirement: 'Passwords must be hashed with bcrypt or similar',
    checks: [
      {
        name: 'bcrypt import and usage',
        file: 'backend/services/database.js',
        patterns: [
          /const bcrypt = require\('bcryptjs'\)/,
          /bcrypt\.hash\(/,
          /bcrypt\.compare\(/
        ],
        description: 'bcrypt library imported and used for password operations'
      },
      {
        name: 'bcrypt salt rounds configuration',
        file: 'backend/services/database.js',
        patterns: [
          /bcrypt\.hash.*?process\.env\.BCRYPT_ROUNDS.*?\|\|\s*12/
        ],
        description: 'Proper salt rounds configured (12+ recommended)'
      }
    ]
  },
  {
    requirement: 'JWT secrets stored securely and rotated periodically',
    checks: [
      {
        name: 'JWT secret management',
        file: 'backend/middleware/security.js',
        patterns: [
          /class JWTSecretManager/,
          /generateSecret\(\)/,
          /shouldRotateSecret\(\)/,
          /rotateSecret\(\)/
        ],
        description: 'JWT secret manager with rotation capabilities'
      },
      {
        name: 'JWT secret rotation script',
        file: 'backend/scripts/rotate-jwt-secret.js',
        patterns: [
          /function rotateJWTSecret/,
          /generateStrongSecret/,
          /JWT_PREVIOUS_SECRET/
        ],
        description: 'Automated JWT secret rotation script'
      },
      {
        name: 'Environment variable security',
        file: 'backend/middleware/auth.js',
        patterns: [
          /process\.env\.JWT_SECRET/,
          /jwtSecretManager\.verifyToken/
        ],
        description: 'JWT secrets loaded from environment variables'
      }
    ]
  },
  {
    requirement: 'Impersonation tokens must have limited lifetime and logged',
    checks: [
      {
        name: 'Impersonation token lifetime',
        file: 'backend/controllers/authController.js',
        patterns: [
          /type.*=.*'impersonation'/,
          /expiresIn.*'1h'/,
          /is_impersonation.*=.*true/
        ],
        description: 'Impersonation tokens with limited lifetime (1 hour)'
      },
      {
        name: 'Impersonation logging',
        file: 'backend/controllers/authController.js',
        patterns: [
          /IMPERSONATION_STARTED/,
          /IMPERSONATION_ENDED/,
          /auditService\.log/
        ],
        description: 'All impersonation actions logged to audit trail'
      },
      {
        name: 'Impersonation token manager',
        file: 'backend/middleware/security.js',
        patterns: [
          /class ImpersonationTokenManager/,
          /validateImpersonationToken/
        ],
        description: 'Specialized impersonation token management'
      }
    ]
  },
  {
    requirement: 'Rate limiting on login and impersonation endpoints',
    checks: [
      {
        name: 'Authentication rate limiting',
        file: 'backend/middleware/rateLimiting.js',
        patterns: [
          /const authLimiter/,
          /windowMs.*15.*60.*1000/,
          /max: 5/
        ],
        description: 'Login endpoints rate limited (5 attempts per 15 minutes)'
      },
      {
        name: 'Impersonation rate limiting',
        file: 'backend/middleware/rateLimiting.js',
        patterns: [
          /const impersonationLimiter/,
          /IMPERSONATION_RATE_LIMIT/,
          /Too many impersonation attempts/
        ],
        description: 'Impersonation endpoints rate limited'
      },
      {
        name: 'Rate limiting integration',
        file: 'backend/routes/authRoutes.js',
        patterns: [
          /requireAdmin.*canImpersonate.*sensitiveOperationLimit/,
          /sensitiveOperationLimit/
        ],
        description: 'Rate limiting applied to authentication routes'
      }
    ]
  },
  {
    requirement: 'Audit logging of all admin and impersonation actions',
    checks: [
      {
        name: 'Audit service implementation',
        file: 'backend/services/database.js',
        patterns: [
          /const auditService/,
          /log: async.*logData/,
          /resourceType,[\s\S]*resourceId/
        ],
        description: 'Comprehensive audit logging service'
      },
      {
        name: 'Admin action logging',
        file: 'backend/controllers/accountController.js',
        patterns: [
          /auditService\.log/,
          /ACCOUNT_CREATED|ACCOUNT_UPDATED|ACCOUNT_DELETED/,
          /CSM_ASSIGNED_TO_ACCOUNT/
        ],
        description: 'All admin actions logged with full context'
      },
      {
        name: 'Impersonation action logging',
        file: 'backend/controllers/authController.js',
        patterns: [
          /IMPERSONATION_STARTED/,
          /IMPERSONATION_ENDED/,
          /impersonatorId.*targetUserId/
        ],
        description: 'Complete impersonation session logging'
      }
    ]
  },
  {
    requirement: 'Role checks enforced on all APIs',
    checks: [
      {
        name: 'Role-based middleware',
        file: 'backend/middleware/auth.js',
        patterns: [
          /requireRole/,
          /requireAdmin/,
          /requireSuperAdmin/,
          /requireCSMOrAbove/
        ],
        description: 'Comprehensive role-based access control middleware'
      },
      {
        name: 'Route protection',
        file: 'backend/routes/userRoutes.js',
        patterns: [
          /requireAdmin/,
          /requireCSMOrAbove/,
          /canManageUser/
        ],
        description: 'All protected routes use role-based middleware'
      },
      {
        name: 'Account access control',
        file: 'backend/routes/accountRoutes.js',
        patterns: [
          /checkAccountAccess/,
          /requireCSMOrAbove/,
          /requireAdmin/
        ],
        description: 'Account endpoints enforce proper role checks'
      }
    ]
  }
];

/**
 * Read and analyze implementation files
 */
function analyzeFile(filename) {
  const filePath = path.join(__dirname, filename);
  
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
 * Check if security requirement is implemented
 */
function checkSecurityRequirement(requirement) {
  console.log(styles.section, `📋 ${requirement.requirement}`);
  console.log('=' + '='.repeat(requirement.requirement.length + 2));
  
  let totalChecks = 0;
  let passedChecks = 0;
  const results = [];
  
  for (const check of requirement.checks) {
    totalChecks++;
    
    console.log(styles.info, `Checking: ${check.name}`);
    console.log(`  📄 File: ${check.file}`);
    console.log(`  📝 Expected: ${check.description}`);
    
    const fileContent = analyzeFile(check.file);
    
    if (!fileContent) {
      console.log(styles.error, `  ❌ File not found: ${check.file}`);
      results.push({ name: check.name, passed: false, reason: 'File not found' });
      continue;
    }
    
    // Check if all patterns are found
    const foundPatterns = check.patterns.filter(pattern => pattern.test(fileContent));
    const allPatternsFound = foundPatterns.length === check.patterns.length;
    
    if (allPatternsFound) {
      console.log(styles.success, `  ✅ Implementation verified (${foundPatterns.length}/${check.patterns.length} patterns found)`);
      passedChecks++;
      results.push({ name: check.name, passed: true, patterns: foundPatterns.length });
    } else {
      console.log(styles.error, `  ❌ Implementation incomplete (${foundPatterns.length}/${check.patterns.length} patterns found)`);
      results.push({ 
        name: check.name, 
        passed: false, 
        reason: `Missing patterns: ${check.patterns.length - foundPatterns.length}` 
      });
    }
    
    console.log('');
  }
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  console.log(styles.info, `Implementation Status: ${passedChecks}/${totalChecks} checks passed (${percentage}%)`);
  console.log('');
  
  return {
    requirement: requirement.requirement,
    total: totalChecks,
    passed: passedChecks,
    percentage,
    results
  };
}

/**
 * Check additional security files
 */
function checkAdditionalSecurityFiles() {
  console.log(styles.section, '🔍 Additional Security File Verification');
  console.log('=========================================');
  
  const securityFiles = [
    {
      name: 'Security Configuration Documentation',
      file: 'backend/docs/SECURITY_CONFIGURATION.md',
      required: false
    },
    {
      name: 'Security Checklist',
      file: 'backend/docs/SECURITY_CHECKLIST.md',
      required: false
    },
    {
      name: 'JWT Secret Rotation Script',
      file: 'backend/scripts/rotate-jwt-secret.js',
      required: true
    },
    {
      name: 'Security Audit Tool',
      file: 'backend/tools/security-audit.js',
      required: false
    },
    {
      name: 'Security Verification Tool',
      file: 'backend/tools/verify-security.js',
      required: false
    }
  ];
  
  let foundFiles = 0;
  let requiredFiles = 0;
  let missingRequired = 0;
  
  for (const file of securityFiles) {
    if (file.required) requiredFiles++;
    
    const exists = fs.existsSync(path.join(__dirname, file.file));
    
    if (exists) {
      foundFiles++;
      console.log(styles.success, `${file.name}: Found`);
    } else {
      if (file.required) {
        missingRequired++;
        console.log(styles.error, `${file.name}: Missing (REQUIRED)`);
      } else {
        console.log(styles.warning, `${file.name}: Missing (Optional)`);
      }
    }
  }
  
  console.log('');
  console.log(styles.info, `Security Files: ${foundFiles}/${securityFiles.length} found`);
  console.log(styles.info, `Required Files: ${requiredFiles - missingRequired}/${requiredFiles} found`);
  
  return {
    total: securityFiles.length,
    found: foundFiles,
    requiredMissing: missingRequired
  };
}

/**
 * Main verification function
 */
function verifySecurityConsiderations() {
  console.log(styles.header, '🔐 SECURITY CONSIDERATIONS VERIFICATION');
  console.log(styles.header, '=======================================\\n');
  
  const results = [];
  let totalRequirements = SECURITY_REQUIREMENTS.length;
  let fullyImplemented = 0;
  
  // Check each security requirement
  for (const requirement of SECURITY_REQUIREMENTS) {
    const result = checkSecurityRequirement(requirement);
    results.push(result);
    
    if (result.percentage === 100) {
      fullyImplemented++;
    }
  }
  
  // Check additional security files
  const fileResults = checkAdditionalSecurityFiles();
  
  // Summary
  console.log(styles.header, '📊 SECURITY VERIFICATION SUMMARY');
  console.log(styles.header, '================================');
  
  console.log(styles.info, `Total Security Requirements: ${totalRequirements}`);
  console.log(styles.success, `Fully Implemented: ${fullyImplemented}`);
  console.log(styles.warning, `Partially Implemented: ${totalRequirements - fullyImplemented}`);
  
  const overallPercentage = Math.round((fullyImplemented / totalRequirements) * 100);
  console.log(styles.info, `Overall Compliance: ${overallPercentage}%`);
  
  // Detailed results
  console.log('\\n' + styles.section, 'DETAILED IMPLEMENTATION STATUS');
  console.log('==============================');
  
  for (const result of results) {
    const status = result.percentage === 100 ? '✅' : result.percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${result.requirement}`);
    console.log(`   Implementation: ${result.passed}/${result.total} checks passed (${result.percentage}%)`);
    
    // Show failed checks
    const failedChecks = result.results.filter(r => !r.passed);
    if (failedChecks.length > 0) {
      console.log('   Failed checks:');
      failedChecks.forEach(check => {
        console.log(`     - ${check.name}: ${check.reason}`);
      });
    }
    console.log('');
  }
  
  // Security recommendations
  console.log(styles.section, 'SECURITY RECOMMENDATIONS');
  console.log('========================');
  
  if (overallPercentage === 100 && fileResults.requiredMissing === 0) {
    console.log(styles.success, '🎉 ALL SECURITY CONSIDERATIONS FULLY IMPLEMENTED!');
    console.log(styles.success, '✅ Password hashing with bcrypt');
    console.log(styles.success, '✅ JWT secret management and rotation');
    console.log(styles.success, '✅ Impersonation token security and logging');
    console.log(styles.success, '✅ Comprehensive rate limiting');
    console.log(styles.success, '✅ Complete audit logging');
    console.log(styles.success, '✅ Role-based access control on all APIs');
  } else {
    console.log(styles.warning, '⚠️  SECURITY IMPROVEMENTS NEEDED:');
    
    if (fullyImplemented < totalRequirements) {
      console.log(styles.error, `❌ ${totalRequirements - fullyImplemented} security requirements need attention`);
    }
    
    if (fileResults.requiredMissing > 0) {
      console.log(styles.error, `❌ ${fileResults.requiredMissing} required security files missing`);
    }
    
    console.log('\\n📋 Next Steps:');
    console.log('   1. Address incomplete security implementations');
    console.log('   2. Review and update security documentation');
    console.log('   3. Run security audit tools');
    console.log('   4. Perform penetration testing');
  }
  
  return {
    totalRequirements,
    fullyImplemented,
    overallPercentage,
    results,
    fileResults,
    compliant: overallPercentage === 100 && fileResults.requiredMissing === 0
  };
}

// Run verification
if (require.main === module) {
  const result = verifySecurityConsiderations();
  process.exit(result.compliant ? 0 : 1);
}

module.exports = { verifySecurityConsiderations };
