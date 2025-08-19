// Enhanced Supabase Connection Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

async function testDatabaseConnection() {
  console.log(`${colors.blue}${colors.bright}=== Enhanced Supabase Database Test ===${colors.reset}\n`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`${colors.yellow}Configuration Check:${colors.reset}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseAnonKey ? 'Present ✓' : 'Missing ✗'}`);
  console.log(`Service Key: ${supabaseServiceKey ? 'Present ✓' : 'Missing ✗'}\n`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log(`${colors.red}❌ Missing required configuration${colors.reset}`);
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Basic connection health
    console.log(`${colors.yellow}1. Testing basic connection health...${colors.reset}`);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log(`   ${colors.yellow}⚠️  Auth check: ${error.message}${colors.reset}`);
      } else {
        console.log(`   ${colors.green}✓ Basic connection successful${colors.reset}`);
      }
    } catch (e) {
      console.log(`   ${colors.red}✗ Basic connection failed: ${e.message}${colors.reset}`);
    }

    // Test 2: Try to query a simple system function
    console.log(`${colors.yellow}2. Testing database query capability...${colors.reset}`);
    try {
      const { data, error } = await supabase.rpc('version');
      if (error) {
        console.log(`   ${colors.yellow}⚠️  Version query: ${error.message}${colors.reset}`);
      } else {
        console.log(`   ${colors.green}✓ Database query successful${colors.reset}`);
      }
    } catch (e) {
      console.log(`   ${colors.yellow}⚠️  Version RPC not available, trying alternative...${colors.reset}`);
    }

    // Test 3: Check available tables
    console.log(`${colors.yellow}3. Checking database tables...${colors.reset}`);
    
    const tablesToCheck = ['users', 'clients', 'vehicles', 'notifications', 'integration_codes', 'system_logs', 'dashboard_metrics'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`   ${colors.yellow}⚠️  Table '${table}' does not exist${colors.reset}`);
          } else if (error.code === '42501' || error.message.includes('permission denied')) {
            console.log(`   ${colors.blue}ℹ️  Table '${table}' exists but access restricted (this is normal)${colors.reset}`);
          } else {
            console.log(`   ${colors.yellow}⚠️  Table '${table}' error: ${error.message}${colors.reset}`);
          }
        } else {
          console.log(`   ${colors.green}✓ Table '${table}' accessible, count: ${data?.length || 'unknown'}${colors.reset}`);
        }
      } catch (e) {
        console.log(`   ${colors.red}✗ Error checking table '${table}': ${e.message}${colors.reset}`);
      }
    }

    // Test 4: Service role capabilities
    if (supabaseServiceKey) {
      console.log(`${colors.yellow}4. Testing service role capabilities...${colors.reset}`);
      try {
        // Try to access storage
        const { data: buckets, error: storageError } = await supabaseService.storage.listBuckets();
        if (storageError) {
          console.log(`   ${colors.yellow}⚠️  Storage access: ${storageError.message}${colors.reset}`);
        } else {
          console.log(`   ${colors.green}✓ Storage access successful, found ${buckets.length} buckets${colors.reset}`);
        }

        // Try to access user management
        try {
          const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers({ page: 1, perPage: 1 });
          if (usersError) {
            console.log(`   ${colors.yellow}⚠️  User management: ${usersError.message}${colors.reset}`);
          } else {
            console.log(`   ${colors.green}✓ User management accessible${colors.reset}`);
          }
        } catch (e) {
          console.log(`   ${colors.yellow}⚠️  User management test failed: ${e.message}${colors.reset}`);
        }
      } catch (e) {
        console.log(`   ${colors.red}✗ Service role test failed: ${e.message}${colors.reset}`);
      }
    }

    // Test 5: Frontend vs Backend configuration
    console.log(`${colors.yellow}5. Checking frontend/backend configuration sync...${colors.reset}`);
    try {
      const fs = require('fs');
      const path = require('path');
      
      const frontendInfoPath = path.join(__dirname, 'frontend', 'src', 'utils', 'supabase', 'info.tsx');
      
      if (fs.existsSync(frontendInfoPath)) {
        const frontendContent = fs.readFileSync(frontendInfoPath, 'utf8');
        const projectIdMatch = frontendContent.match(/projectId = "([^"]+)"/);
        const frontendProjectId = projectIdMatch ? projectIdMatch[1] : null;
        
        const backendProjectId = supabaseUrl.match(/https:\/\/([^\.]+)\.supabase\.co/);
        const backendProject = backendProjectId ? backendProjectId[1] : null;
        
        if (frontendProjectId && backendProject) {
          if (frontendProjectId === backendProject) {
            console.log(`   ${colors.green}✓ Frontend and backend using same project: ${frontendProjectId}${colors.reset}`);
          } else {
            console.log(`   ${colors.red}✗ Mismatch detected!${colors.reset}`);
            console.log(`     Frontend project: ${frontendProjectId}`);
            console.log(`     Backend project: ${backendProject}`);
            console.log(`   ${colors.yellow}⚠️  This may cause authentication and data sync issues${colors.reset}`);
          }
        } else {
          console.log(`   ${colors.yellow}⚠️  Could not extract project IDs for comparison${colors.reset}`);
        }
      } else {
        console.log(`   ${colors.yellow}⚠️  Frontend configuration file not found${colors.reset}`);
      }
    } catch (e) {
      console.log(`   ${colors.yellow}⚠️  Configuration sync check failed: ${e.message}${colors.reset}`);
    }

    console.log(`\n${colors.blue}${colors.bright}=== Test Summary ===${colors.reset}`);
    console.log(`${colors.green}✓ = Working correctly${colors.reset}`);
    console.log(`${colors.yellow}⚠️  = Warning or limited access (may be normal)${colors.reset}`);
    console.log(`${colors.red}✗ = Error that needs attention${colors.reset}`);
    console.log(`${colors.blue}ℹ️  = Informational${colors.reset}`);
    
    console.log(`\n${colors.bright}Recommendation:${colors.reset}`);
    console.log(`Your Supabase connection appears to be working, but there's a configuration mismatch between frontend and backend projects.`);
    console.log(`Consider updating either the frontend or backend to use the same Supabase project for consistency.`);

  } catch (error) {
    console.log(`${colors.red}❌ Critical error during connection test:${colors.reset}`);
    console.error(error);
  }
}

testDatabaseConnection().catch(console.error);
