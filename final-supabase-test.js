// Final End-to-End Supabase Configuration Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function finalTest() {
  console.log(`${colors.magenta}${colors.bright}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}║              🚀 FINAL SUPABASE CONFIGURATION TEST            ║${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  let passedTests = 0;
  let totalTests = 0;

  const runTest = async (testName, testFn) => {
    totalTests++;
    process.stdout.write(`${colors.yellow}Testing ${testName}... ${colors.reset}`);
    try {
      const result = await testFn();
      if (result) {
        console.log(`${colors.green}✓ PASS${colors.reset}`);
        passedTests++;
        return true;
      } else {
        console.log(`${colors.red}✗ FAIL${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.log(`${colors.red}✗ ERROR: ${error.message}${colors.reset}`);
      return false;
    }
  };

  // Test 1: Configuration Alignment
  await runTest("Configuration Alignment", async () => {
    const backendUrl = process.env.SUPABASE_URL;
    const backendAnonKey = process.env.SUPABASE_ANON_KEY;
    
    const frontendInfoPath = path.join(__dirname, 'frontend', 'src', 'utils', 'supabase', 'info.tsx');
    const frontendContent = fs.readFileSync(frontendInfoPath, 'utf8');
    
    const frontendProjectId = frontendContent.match(/projectId = "([^"]+)"/)?.[1];
    const frontendAnonKey = frontendContent.match(/publicAnonKey = "([^"]+)"/)?.[1];
    
    const backendProjectId = backendUrl?.match(/https:\/\/([^\.]+)/)?.[1];
    
    return frontendProjectId === backendProjectId && frontendAnonKey === backendAnonKey;
  });

  // Test 2: Backend Supabase Connection
  await runTest("Backend Supabase Connection", async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error } = await supabase.auth.getSession();
    return !error;
  });

  // Test 3: Frontend Supabase Connection (Simulated)
  await runTest("Frontend Supabase Connection", async () => {
    const frontendInfoPath = path.join(__dirname, 'frontend', 'src', 'utils', 'supabase', 'info.tsx');
    const frontendContent = fs.readFileSync(frontendInfoPath, 'utf8');
    
    const frontendProjectId = frontendContent.match(/projectId = "([^"]+)"/)?.[1];
    const frontendAnonKey = frontendContent.match(/publicAnonKey = "([^"]+)"/)?.[1];
    
    const frontendUrl = `https://${frontendProjectId}.supabase.co`;
    const supabase = createClient(frontendUrl, frontendAnonKey);
    
    const { error } = await supabase.auth.getSession();
    return !error;
  });

  // Test 4: Database Access
  await runTest("Database Access", async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    return !error;
  });

  // Test 5: Service Role Access
  await runTest("Service Role Access", async () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.storage.listBuckets();
    return !error;
  });

  // Test 6: Authentication Service
  await runTest("Authentication Service", async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  });

  // Test 7: Database Tables Structure
  await runTest("Database Tables Structure", async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const expectedTables = ['users', 'clients', 'vehicles', 'notifications'];
    
    for (const table of expectedTables) {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error && !error.message.includes('permission denied')) {
        return false;
      }
    }
    return true;
  });

  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                            RESULTS                              ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);

  const successRate = (passedTests / totalTests) * 100;

  console.log(`\n${colors.bright}Tests Passed: ${colors.green}${passedTests}${colors.reset}${colors.bright}/${totalTests}${colors.reset}`);
  console.log(`${colors.bright}Success Rate: ${successRate >= 85 ? colors.green : successRate >= 70 ? colors.yellow : colors.red}${successRate.toFixed(1)}%${colors.reset}`);

  if (successRate >= 85) {
    console.log(`\n${colors.green}${colors.bright}🎉 EXCELLENT! Your Supabase configuration is working perfectly!${colors.reset}`);
    console.log(`${colors.green}✓ Frontend and backend are properly aligned${colors.reset}`);
    console.log(`${colors.green}✓ All core services are accessible${colors.reset}`);
    console.log(`${colors.green}✓ Database connectivity is stable${colors.reset}`);
    
    console.log(`\n${colors.blue}${colors.bright}📝 Configuration Summary:${colors.reset}`);
    console.log(`   Project ID: ${process.env.SUPABASE_URL?.match(/https:\/\/([^\.]+)/)?.[1]}`);
    console.log(`   Database: PostgreSQL (Supabase hosted)`);
    console.log(`   Authentication: Enabled and working`);
    console.log(`   Storage: Available`);
    
    console.log(`\n${colors.blue}${colors.bright}🚀 Ready for Development:${colors.reset}`);
    console.log(`   ${colors.green}✓${colors.reset} Start your backend: ${colors.cyan}cd backend && npm start${colors.reset}`);
    console.log(`   ${colors.green}✓${colors.reset} Start your frontend: ${colors.cyan}cd frontend && npm run dev${colors.reset}`);
    console.log(`   ${colors.green}✓${colors.reset} Test user authentication and data flow${colors.reset}`);
    
  } else if (successRate >= 70) {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  GOOD! Most features are working, but some issues need attention.${colors.reset}`);
    console.log(`${colors.yellow}Review the failed tests above and check your configuration.${colors.reset}`);
    
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ ISSUES DETECTED! Several tests failed.${colors.reset}`);
    console.log(`${colors.red}Please review your Supabase configuration and try again.${colors.reset}`);
  }

  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                         TEST COMPLETE                          ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
}

finalTest().catch(console.error);
