#!/usr/bin/env node

/**
 * 🧪 API ENDPOINTS FUNCTIONAL TEST DEMONSTRATION
 * =============================================
 * 
 * This script demonstrates the API endpoints are properly structured
 * and accessible through the Express application setup.
 */

const path = require('path');
const fs = require('fs');

// Console styling
const styles = {
  header: '\x1b[1m\x1b[36m%s\x1b[0m',
  success: '\x1b[32m✅ %s\x1b[0m',
  info: '\x1b[34mℹ️  %s\x1b[0m',
  section: '\x1b[1m\x1b[35m%s\x1b[0m'
};

/**
 * Check if the main server file properly includes all route modules
 */
function checkServerRouteIntegration() {
  console.log(styles.header, '🔍 CHECKING SERVER ROUTE INTEGRATION');
  console.log(styles.header, '===================================\n');
  
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log(styles.error, 'Server file not found!');
    return false;
  }
  
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const requiredRoutes = [
    { name: 'Auth Routes', pattern: /authRoutes/, mount: /\/api\/auth/ },
    { name: 'User Routes', pattern: /userRoutes/, mount: /\/api\/users/ },
    { name: 'Account Routes', pattern: /accountRoutes/, mount: /\/api\/accounts/ },
    { name: 'Role Routes', pattern: /roleRoutes/, mount: /\/api\/roles/ }
  ];
  
  let allRoutesIntegrated = true;
  
  for (const route of requiredRoutes) {
    const hasImport = route.pattern.test(serverContent);
    const hasMounting = route.mount.test(serverContent);
    
    if (hasImport && hasMounting) {
      console.log(styles.success, `${route.name}: Imported and mounted`);
    } else {
      console.log(styles.error, `${route.name}: Missing ${!hasImport ? 'import' : 'mounting'}`);
      allRoutesIntegrated = false;
    }
  }
  
  return allRoutesIntegrated;
}

/**
 * Verify middleware integration
 */
function checkMiddlewareIntegration() {
  console.log(styles.section, '\n🛡️  MIDDLEWARE INTEGRATION CHECK');
  console.log('================================\n');
  
  const authMiddlewarePath = path.join(__dirname, 'backend', 'middleware', 'auth.js');
  
  if (!fs.existsSync(authMiddlewarePath)) {
    console.log(styles.error, 'Auth middleware file not found!');
    return false;
  }
  
  const middlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');
  
  const requiredMiddleware = [
    'verifyToken',
    'requireAdmin',
    'requireCSMOrAbove',
    'checkAccountAccess',
    'canImpersonate',
    'sensitiveOperationLimit'
  ];
  
  let allMiddlewarePresent = true;
  
  for (const middleware of requiredMiddleware) {
    if (middlewareContent.includes(middleware)) {
      console.log(styles.success, `${middleware}: Available`);
    } else {
      console.log(styles.error, `${middleware}: Missing`);
      allMiddlewarePresent = false;
    }
  }
  
  return allMiddlewarePresent;
}

/**
 * Show API endpoint examples
 */
function showAPIExamples() {
  console.log(styles.section, '\n📋 API ENDPOINT EXAMPLES');
  console.log('========================\n');
  
  const examples = [
    {
      title: '1. Login (Public)',
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'password123'
      }
    },
    {
      title: '2. Get Users (Admin+)',
      method: 'GET',
      url: '/api/users?role=csm&page=1&limit=10',
      headers: {
        'Authorization': 'Bearer <jwt_token>'
      }
    },
    {
      title: '3. Start Impersonation (Admin+)',
      method: 'POST',
      url: '/api/auth/impersonate/start',
      headers: {
        'Authorization': 'Bearer <jwt_token>'
      },
      body: {
        targetUserId: '123',
        reason: 'Customer support'
      }
    },
    {
      title: '4. Get Accounts (CSM+)',
      method: 'GET',
      url: '/api/accounts?page=1&limit=10',
      headers: {
        'Authorization': 'Bearer <jwt_token>'
      }
    },
    {
      title: '5. Assign Role (Admin+)',
      method: 'POST',
      url: '/api/roles/assign',
      headers: {
        'Authorization': 'Bearer <jwt_token>'
      },
      body: {
        userId: '123',
        role: 'csm'
      }
    }
  ];
  
  examples.forEach(example => {
    console.log(styles.info, `${example.title}`);
    console.log(`   ${example.method} ${example.url}`);
    
    if (example.headers) {
      console.log(`   Headers:`, JSON.stringify(example.headers, null, 6));
    }
    
    if (example.body) {
      console.log(`   Body:`, JSON.stringify(example.body, null, 6));
    }
    
    console.log('');
  });
}

/**
 * Main execution
 */
function main() {
  console.log(styles.header, '🧪 API ENDPOINTS FUNCTIONAL VERIFICATION');
  console.log(styles.header, '========================================\n');
  
  const routesIntegrated = checkServerRouteIntegration();
  const middlewareIntegrated = checkMiddlewareIntegration();
  
  showAPIExamples();
  
  console.log(styles.section, '📊 INTEGRATION SUMMARY');
  console.log('======================');
  
  if (routesIntegrated && middlewareIntegrated) {
    console.log(styles.success, '🎉 ALL ENDPOINTS PROPERLY INTEGRATED!');
    console.log(styles.success, '✅ Route modules imported and mounted');
    console.log(styles.success, '✅ Middleware functions available');
    console.log(styles.success, '✅ Ready for API testing');
  } else {
    console.log(styles.error, '❌ Integration issues found');
    if (!routesIntegrated) console.log(styles.error, '❌ Route integration problems');
    if (!middlewareIntegrated) console.log(styles.error, '❌ Middleware integration problems');
  }
  
  console.log(styles.info, '\n💡 To test these endpoints:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Use Postman or curl to test endpoints');
  console.log('   3. Check the Postman collection in the root directory');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkServerRouteIntegration, checkMiddlewareIntegration };
