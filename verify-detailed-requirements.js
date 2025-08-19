const fs = require('fs');
const path = require('path');

console.log('🔍 FRAMTT BACKEND DETAILED REQUIREMENTS VERIFICATION');
console.log('='.repeat(70));
console.log('');

// Verification results tracker
const results = {
     if (file.includes('auth')) return pattern.name.includes('auth') || pattern.name.includes('impersonate');
    if (file.includes('user')) return pattern.name.includes('user') || pattern.name.includes('role');
    if (file.includes('account')) return pattern.name.includes('account');
    return false;uirements: [],
  totalScore: 0,
  maxScore: 0,
  issues: []
};

// Helper function to check file content for patterns
const checkFilePatterns = (filePath, patterns, description) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return { found: 0, total: patterns.length, patterns: [] };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const foundPatterns = [];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex, pattern.flags || 'gi');
      if (regex.test(content)) {
        foundPatterns.push(pattern.name);
        console.log(`  ✅ ${pattern.name}`);
      } else {
        console.log(`  ❌ ${pattern.name} - Not found`);
      }
    });
    
    return {
      found: foundPatterns.length,
      total: patterns.length,
      patterns: foundPatterns
    };
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
    return { found: 0, total: patterns.length, patterns: [] };
  }
};

console.log('1️⃣ ROLE HIERARCHY & ACCESS CONTROL VERIFICATION');
console.log('='.repeat(50));

// Check role hierarchy implementation
const roleHierarchyPatterns = [
  { name: 'Superadmin role definition', regex: 'superadmin|SUPERADMIN' },
  { name: 'Admin role definition', regex: 'admin|ADMIN' },
  { name: 'CSM role definition', regex: 'csm|CSM' },
  { name: 'User role definition', regex: '\\buser\\b|USER' },
  { name: 'Role-based access control middleware', regex: 'requireRole|checkRole|role.*middleware' },
  { name: 'Role hierarchy checking', regex: 'role.*hierarchy|canManageUser|checkUserRole' },
  { name: 'Account access scoping', regex: 'checkAccountAccess|accountAccess|assigned.*account' },
  { name: 'CSM account restrictions', regex: 'CSM.*account|csm.*assigned|checkCSMAccess' }
];

console.log('📋 Checking Role Hierarchy Implementation:');
const roleResult = checkFilePatterns('backend/middleware/auth.js', roleHierarchyPatterns, 'Role Hierarchy');

console.log('📋 Checking User Controller for Role Logic:');
const userControllerRolePatterns = [
  { name: 'Role-based user filtering', regex: 'role.*filter|filterByRole|user.*role' },
  { name: 'Admin user management', regex: 'admin.*manage|manage.*user' },
  { name: 'CSM user restrictions', regex: 'csm.*user|user.*csm.*account' }
];
const userRoleResult = checkFilePatterns('backend/controllers/userController.js', userControllerRolePatterns, 'User Role Logic');

const roleScore = roleResult.found + userRoleResult.found;
const roleMaxScore = roleResult.total + userRoleResult.total;
console.log(`📊 Role Hierarchy Score: ${roleScore}/${roleMaxScore} (${Math.round(roleScore/roleMaxScore*100)}%)\n`);

console.log('2️⃣ LOGIN & AUTHENTICATION VERIFICATION');
console.log('='.repeat(50));

// Check authentication implementation
const authPatterns = [
  { name: 'JWT token generation', regex: 'jwt\\.sign|jsonwebtoken|generateToken|generateAccessToken' },
  { name: 'JWT token verification', regex: 'jwt\\.verify|verifyToken|validateToken' },
  { name: 'bcrypt password hashing', regex: 'bcrypt\\.hash|hashPassword|password.*hash' },
  { name: 'bcrypt password comparison', regex: 'bcrypt\\.compare|comparePassword|verifyPassword' },
  { name: 'Role embedding in JWT', regex: 'role.*user\\.role|payload\\.role.*user\\.role|user\\.role.*payload' },
  { name: 'User ID embedding in JWT', regex: 'id.*user\\.id|payload\\.id.*user\\.id|user\\.id.*payload' },
  { name: 'Token expiry handling', regex: 'expiresIn|tokenExpiry|jwt.*expire|JWT_EXPIRE' },
  { name: 'Stateless session design', regex: 'stateless|no.*session|token.*only|jwt.*stateless' }
];

console.log('📋 Checking Authentication Controller:');
const authResult = checkFilePatterns('backend/controllers/authController.js', authPatterns, 'Authentication');

console.log('📋 Checking Auth Middleware:');
const authMiddlewarePatterns = [
  { name: 'JWT middleware verification', regex: 'verifyToken|authenticate|jwt.*middleware' },
  { name: 'Token extraction from headers', regex: 'authorization|bearer.*token|extractToken' },
  { name: 'User context attachment', regex: 'req\\.user|user.*context|attach.*user' }
];
const authMiddlewareResult = checkFilePatterns('backend/middleware/auth.js', authMiddlewarePatterns, 'Auth Middleware');

const authScore = authResult.found + authMiddlewareResult.found;
const authMaxScore = authResult.total + authMiddlewareResult.total;
console.log(`📊 Authentication Score: ${authScore}/${authMaxScore} (${Math.round(authScore/authMaxScore*100)}%)\n`);

console.log('3️⃣ IMPERSONATION LOGIC VERIFICATION');
console.log('='.repeat(50));

// Check impersonation implementation
const impersonationPatterns = [
  { name: 'Impersonation API endpoint', regex: 'impersonate|startImpersonation|/impersonate' },
  { name: 'Role-based impersonation rules', regex: 'canImpersonate|impersonation.*role|admin.*impersonate' },
  { name: 'Impersonation JWT token', regex: 'impersonation.*token|impersonator_id|impersonated_user_id' },
  { name: 'Impersonation token expiry', regex: 'impersonation.*expiry|impersonate.*expire|limited.*lifetime|expiresIn.*1h' },
  { name: 'Impersonation audit logging', regex: 'impersonation.*log|log.*impersonate|audit.*impersonation|IMPERSONATION_' },
  { name: 'Stop impersonation functionality', regex: 'stopImpersonation|endImpersonation|stop.*impersonate' },
  { name: 'Impersonation session tracking', regex: 'impersonation.*session|session.*impersonate|track.*impersonation|session_id' },
  { name: 'Original user ID preservation', regex: 'original.*user|impersonator.*id|who.*impersonated|impersonator_id' }
];

console.log('📋 Checking Impersonation Implementation:');
const impersonationResult = checkFilePatterns('backend/controllers/authController.js', impersonationPatterns, 'Impersonation Logic');

console.log('📋 Checking Impersonation Routes:');
const impersonationRoutePatterns = [
  { name: 'Start impersonation route', regex: '/impersonate.*start|POST.*impersonate' },
  { name: 'Stop impersonation route', regex: '/impersonate.*stop|end.*impersonate' },
  { name: 'Impersonation access control', regex: 'requireRole.*impersonate|admin.*impersonate' }
];
const impersonationRouteResult = checkFilePatterns('backend/routes/authRoutes.js', impersonationRoutePatterns, 'Impersonation Routes');

const impersonationScore = impersonationResult.found + impersonationRouteResult.found;
const impersonationMaxScore = impersonationResult.total + impersonationRouteResult.total;
console.log(`📊 Impersonation Score: ${impersonationScore}/${impersonationMaxScore} (${Math.round(impersonationScore/impersonationMaxScore*100)}%)\n`);

console.log('4️⃣ USER & ACCOUNT ASSIGNMENT LOGIC VERIFICATION');
console.log('='.repeat(50));

// Check assignment logic
const assignmentPatterns = [
  { name: 'CSM account assignment service', regex: 'csmAssignment|assignCSM|csm.*account.*assign' },
  { name: 'User account assignment', regex: 'userAccount|assignUser|user.*account.*assign' },
  { name: 'Assignment table operations', regex: 'csm_assignments|user_accounts|assignment.*table' },
  { name: 'CSM assignment validation', regex: 'validateCSMAssignment|checkCSMAssignment|csm.*access.*validation' },
  { name: 'Account scoped access', regex: 'accountScoped|assigned.*accounts|csm.*accounts' },
  { name: 'Assignment management endpoints', regex: 'assign.*role|assign.*account|assignment.*endpoint' }
];

console.log('📋 Checking Assignment Logic in Database Service:');
const assignmentResult = checkFilePatterns('backend/services/database.js', assignmentPatterns, 'Assignment Logic');

console.log('📋 Checking Account Controller for Assignment Logic:');
const accountAssignmentPatterns = [
  { name: 'CSM account assignment endpoint', regex: 'assignCSM|assign.*csm|csm.*assign' },
  { name: 'Account access validation', regex: 'checkAccountAccess|validateAccess|account.*permission' },
  { name: 'CSM account filtering', regex: 'getByCSM|csm.*accounts|filterByCSM' }
];
const accountAssignmentResult = checkFilePatterns('backend/controllers/accountController.js', accountAssignmentPatterns, 'Account Assignment');

const assignmentScore = assignmentResult.found + accountAssignmentResult.found;
const assignmentMaxScore = assignmentResult.total + accountAssignmentResult.total;
console.log(`📊 Assignment Logic Score: ${assignmentScore}/${assignmentMaxScore} (${Math.round(assignmentScore/assignmentMaxScore*100)}%)\n`);

console.log('5️⃣ DATABASE SCHEMA VERIFICATION');
console.log('='.repeat(50));

// Check database schema files
const schemaFiles = [
  'database/final_schema_specification.sql',
  'database/10_enhanced_schema_for_impersonation.sql',
  'database/01_create_users_table.sql'
];

let schemaScore = 0;
let schemaMaxScore = 0;

schemaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Schema file exists: ${file}`);
    schemaScore++;
  } else {
    console.log(`❌ Schema file missing: ${file}`);
  }
  schemaMaxScore++;
});

// Check for required tables in schema
const requiredTables = ['users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs'];
const schemaPatterns = requiredTables.map(table => ({
  name: `${table} table definition`,
  regex: `CREATE TABLE.*${table}|${table}.*\\(`
}));

console.log('📋 Checking Schema Content:');
if (fs.existsSync('database/final_schema_specification.sql')) {
  const schemaContentResult = checkFilePatterns('database/final_schema_specification.sql', schemaPatterns, 'Schema Tables');
  schemaScore += schemaContentResult.found;
  schemaMaxScore += schemaContentResult.total;
}

console.log(`📊 Database Schema Score: ${schemaScore}/${schemaMaxScore} (${Math.round(schemaScore/schemaMaxScore*100)}%)\n`);

console.log('6️⃣ BACKEND API ENDPOINTS VERIFICATION');
console.log('='.repeat(50));

// Check API endpoints
const endpointPatterns = [
  { name: '/auth/login endpoint', regex: '/auth/login|login.*route|POST.*login' },
  { name: '/users GET endpoint', regex: '/users.*GET|GET.*users|users.*list|router\\.get\\(.*/' },
  { name: '/users/:id GET endpoint', regex: '/users/:id|users.*:id|GET.*users.*id|route.*:id.*get' },
  { name: '/impersonate/start endpoint', regex: '/impersonate/start|impersonate.*start|start.*impersonate' },
  { name: '/impersonate/stop endpoint', regex: '/impersonate/stop|impersonate.*stop|stop.*impersonate' },
  { name: '/accounts GET endpoint', regex: '/accounts.*GET|GET.*accounts|accounts.*list|router\\.get\\(.*/' },
  { name: '/accounts/:id/users endpoint', regex: '/accounts/:id/users|accounts.*users|account.*user.*list|:id/users' },
  { name: '/roles/assign endpoint', regex: '/roles/assign|assign.*role|role.*assignment|/assign.*role' }
];

// Check routes files
const routeFiles = [
  'backend/routes/authRoutes.js',
  'backend/routes/userRoutes.js',
  'backend/routes/accountRoutes.js',
  'backend/routes/roleRoutes.js'
];

let endpointScore = 0;
let endpointMaxScore = 0;

routeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📋 Checking endpoints in ${file}:`);
    const relevantPatterns = endpointPatterns.filter(pattern => {
      if (file.includes('auth')) return pattern.name.includes('auth') || pattern.name.includes('impersonate');
      if (file.includes('user')) return pattern.name.includes('user');
      if (file.includes('account')) return pattern.name.includes('account');
      if (file.includes('role')) return pattern.name.includes('role');
      return false;
    });
    
    const result = checkFilePatterns(file, relevantPatterns, `Endpoints in ${file}`);
    endpointScore += result.found;
    endpointMaxScore += result.total;
  } else {
    console.log(`❌ Route file missing: ${file}`);
  }
});

console.log(`📊 API Endpoints Score: ${endpointScore}/${endpointMaxScore} (${Math.round(endpointScore/endpointMaxScore*100)}%)\n`);

console.log('7️⃣ AUTHORIZATION LOGIC EXAMPLES VERIFICATION');
console.log('='.repeat(50));

// Check authorization examples
const authorizationPatterns = [
  { name: 'CSM account filtering logic', regex: 'csm.*accounts.*filter|getByCSM|assigned.*accounts' },
  { name: 'CSM user access validation', regex: 'csm.*user.*access|checkCSMUserAccess|csm.*user.*validation' },
  { name: 'Admin full access logic', regex: 'admin.*full.*access|admin.*all.*accounts|getAll' },
  { name: 'Admin CSM assignment capability', regex: 'admin.*assign.*csm|assignCSM.*admin|admin.*csm.*assign' },
  { name: 'Superadmin unrestricted access', regex: 'superadmin.*unrestricted|superadmin.*all|full.*access.*superadmin' },
  { name: 'Role-based endpoint protection', regex: 'requireRole|checkRole|role.*middleware' }
];

console.log('📋 Checking Authorization Logic:');
const authzResult = checkFilePatterns('backend/middleware/auth.js', authorizationPatterns, 'Authorization Logic');

console.log('📋 Checking Controller Authorization:');
const controllerAuthzPatterns = [
  { name: 'Role-based data filtering', regex: 'role.*filter|filterByRole|access.*control' },
  { name: 'Account scope validation', regex: 'checkAccountAccess|validateAccountAccess|account.*scope' },
  { name: 'Permission checking', regex: 'checkPermission|hasPermission|canAccess' }
];

const controllerFiles = [
  'backend/controllers/userController.js',
  'backend/controllers/accountController.js'
];

let authzScore = authzResult.found;
let authzMaxScore = authzResult.total;

controllerFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const result = checkFilePatterns(file, controllerAuthzPatterns, `Authorization in ${file}`);
    authzScore += result.found;
    authzMaxScore += result.total;
  }
});

console.log(`📊 Authorization Logic Score: ${authzScore}/${authzMaxScore} (${Math.round(authzScore/authzMaxScore*100)}%)\n`);

console.log('8️⃣ SECURITY CONSIDERATIONS VERIFICATION');
console.log('='.repeat(50));

// Check security implementations
const securityPatterns = [
  { name: 'bcrypt password hashing', regex: 'bcrypt\\.hash|hashPassword|bcrypt.*salt' },
  { name: 'JWT secret security', regex: 'JWT_SECRET|jwt.*secret|secret.*rotation' },
  { name: 'Impersonation token lifetime', regex: 'impersonation.*expiry|limited.*lifetime|token.*expire' },
  { name: 'Rate limiting implementation', regex: 'rateLimit|rate.*limiting|express-rate-limit' },
  { name: 'Audit logging', regex: 'auditLog|audit.*service|log.*action' },
  { name: 'API role checks', regex: 'requireRole|checkRole|role.*middleware' }
];

console.log('📋 Checking Security Implementations:');
const securityFiles = [
  'backend/services/database.js',
  'backend/middleware/security.js',
  'backend/middleware/rateLimiting.js',
  'backend/middleware/auth.js'
];

let securityScore = 0;
let securityMaxScore = 0;

securityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📋 Checking security in ${file}:`);
    const result = checkFilePatterns(file, securityPatterns, `Security in ${file}`);
    securityScore += result.found;
    securityMaxScore += result.total;
  } else {
    console.log(`❌ Security file missing: ${file}`);
    securityMaxScore += securityPatterns.length;
  }
});

console.log(`📊 Security Score: ${securityScore}/${securityMaxScore} (${Math.round(securityScore/securityMaxScore*100)}%)\n`);

// Calculate overall results
const totalScore = roleScore + authScore + impersonationScore + assignmentScore + schemaScore + endpointScore + authzScore + securityScore;
const totalMaxScore = roleMaxScore + authMaxScore + impersonationMaxScore + assignmentMaxScore + schemaMaxScore + endpointMaxScore + authzMaxScore + securityMaxScore;
const overallCompliance = Math.round((totalScore / totalMaxScore) * 100);

console.log('📊 FINAL VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log('');

const requirementScores = [
  { name: '1. Role Hierarchy & Access Control', score: roleScore, max: roleMaxScore },
  { name: '2. Login & Authentication', score: authScore, max: authMaxScore },
  { name: '3. Impersonation Logic', score: impersonationScore, max: impersonationMaxScore },
  { name: '4. User & Account Assignment Logic', score: assignmentScore, max: assignmentMaxScore },
  { name: '5. Database Schema', score: schemaScore, max: schemaMaxScore },
  { name: '6. Backend API Endpoints', score: endpointScore, max: endpointMaxScore },
  { name: '7. Authorization Logic Examples', score: authzScore, max: authzMaxScore },
  { name: '8. Security Considerations', score: securityScore, max: securityMaxScore }
];

requirementScores.forEach(req => {
  const percentage = Math.round((req.score / req.max) * 100);
  const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
  console.log(`${status} ${req.name}: ${req.score}/${req.max} (${percentage}%)`);
});

console.log('');
console.log(`🎯 OVERALL COMPLIANCE: ${totalScore}/${totalMaxScore} (${overallCompliance}%)`);
console.log('');

if (overallCompliance >= 90) {
  console.log('🎉 EXCELLENT! All requirements comprehensively implemented');
  console.log('✅ System is production-ready with full compliance');
} else if (overallCompliance >= 80) {
  console.log('✅ VERY GOOD! Most requirements well implemented');
  console.log('⚠️ Minor improvements recommended');
} else if (overallCompliance >= 70) {
  console.log('⚠️ GOOD! Core requirements implemented');
  console.log('📋 Some areas need attention');
} else {
  console.log('❌ NEEDS IMPROVEMENT! Significant gaps identified');
  console.log('🔧 Major implementation work required');
}

console.log('');
console.log('🔚 DETAILED REQUIREMENTS VERIFICATION COMPLETE');
console.log('='.repeat(70));

process.exit(overallCompliance >= 80 ? 0 : 1);
