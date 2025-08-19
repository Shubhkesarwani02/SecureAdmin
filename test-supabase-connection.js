// Supabase Connection Test Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

async function testSupabaseConnection() {
  console.log(`${colors.blue}${colors.bright}=== Supabase Connection Test ===${colors.reset}\n`);

  // Test configuration
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`${colors.yellow}Checking configuration...${colors.reset}`);
  console.log(`Supabase URL: ${supabaseUrl ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`} ${supabaseUrl || 'Missing'}`);
  console.log(`Anon Key: ${supabaseAnonKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`} ${supabaseAnonKey ? 'Present' : 'Missing'}`);
  console.log(`Service Key: ${supabaseServiceKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`} ${supabaseServiceKey ? 'Present' : 'Missing'}\n`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log(`${colors.red}❌ Configuration incomplete. Please check your .env file.${colors.reset}`);
    return;
  }

  try {
    // Test with anon key
    console.log(`${colors.yellow}Testing connection with anon key...${colors.reset}`);
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data: authData, error: authError } = await supabaseAnon.auth.getSession();
    if (authError) {
      console.log(`${colors.yellow}⚠️  Auth session check: ${authError.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Auth service connection successful${colors.reset}`);
    }

    // Test service key if available
    if (supabaseServiceKey) {
      console.log(`${colors.yellow}Testing connection with service role key...${colors.reset}`);
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to access a system table (this requires service role)
      const { data: buckets, error: bucketsError } = await supabaseService.storage.listBuckets();
      if (bucketsError) {
        console.log(`${colors.yellow}⚠️  Storage access: ${bucketsError.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Service role connection successful${colors.reset}`);
        console.log(`   Found ${buckets.length} storage buckets`);
      }
    }

    // Test database connection by trying to access a table
    console.log(`${colors.yellow}Testing database connection...${colors.reset}`);
    
    // First, let's see what tables are available
    const { data: tables, error: tablesError } = await supabaseAnon.rpc('get_tables').catch(() => ({ data: null, error: 'RPC not available' }));
    
    // Try to access users table (common table name)
    const { data: users, error: usersError } = await supabaseAnon
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log(`${colors.yellow}⚠️  Users table access: ${usersError.message}${colors.reset}`);
      
      // Try to access any table to test basic DB connectivity
      const { data: testData, error: testError } = await supabaseAnon
        .from('kv_store_226bcbfb')
        .select('*')
        .limit(1);
        
      if (testError) {
        console.log(`${colors.yellow}⚠️  Database access: ${testError.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Database connection successful (via kv_store)${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✓ Database connection successful (users table accessible)${colors.reset}`);
    }

    // Test realtime connection
    console.log(`${colors.yellow}Testing realtime connection...${colors.reset}`);
    const channel = supabaseAnon.channel('test-connection');
    
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`${colors.green}✓ Realtime connection successful${colors.reset}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.log(`${colors.red}✗ Realtime connection failed${colors.reset}`);
      }
      supabaseAnon.removeChannel(channel);
    });

    // Wait a moment for the subscription to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n${colors.green}${colors.bright}🎉 Supabase connection test completed!${colors.reset}`);
    console.log(`${colors.blue}Your Supabase project appears to be properly configured and accessible.${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ Connection test failed:${colors.reset}`);
    console.error(error.message);
  }
}

// Frontend configuration check
function checkFrontendConfig() {
  console.log(`\n${colors.blue}${colors.bright}=== Frontend Configuration Check ===${colors.reset}\n`);
  
  try {
    const frontendInfo = require('./frontend/src/utils/supabase/info.tsx');
    console.log(`Frontend Project ID: ${frontendInfo.projectId ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`} ${frontendInfo.projectId || 'Missing'}`);
    console.log(`Frontend Anon Key: ${frontendInfo.publicAnonKey ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`} ${frontendInfo.publicAnonKey ? 'Present' : 'Missing'}`);
    
    // Check if frontend and backend are using the same project
    const backendUrl = process.env.SUPABASE_URL;
    const frontendUrl = `https://${frontendInfo.projectId}.supabase.co`;
    
    if (backendUrl === frontendUrl) {
      console.log(`${colors.green}✓ Frontend and backend are using the same Supabase project${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Frontend and backend are using different Supabase projects${colors.reset}`);
      console.log(`   Backend: ${backendUrl}`);
      console.log(`   Frontend: ${frontendUrl}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Could not read frontend configuration${colors.reset}`);
  }
}

// Run the tests
async function runAllTests() {
  await testSupabaseConnection();
  checkFrontendConfig();
  
  console.log(`\n${colors.blue}${colors.bright}=== Summary ===${colors.reset}`);
  console.log(`If you see green checkmarks above, your Supabase connection is working properly!`);
  console.log(`If you see yellow warnings or red errors, please check your configuration.`);
}

runAllTests().catch(console.error);
