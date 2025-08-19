// Frontend-Backend Supabase Alignment Verification
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
  cyan: '\x1b[36m'
};

async function verifyAlignment() {
  console.log(`${colors.cyan}${colors.bright}=== Frontend-Backend Supabase Alignment Verification ===${colors.reset}\n`);

  // Read backend configuration
  const backendUrl = process.env.SUPABASE_URL;
  const backendAnonKey = process.env.SUPABASE_ANON_KEY;
  const backendServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Read frontend configuration
  let frontendProjectId, frontendAnonKey;
  try {
    const frontendInfoPath = path.join(__dirname, 'frontend', 'src', 'utils', 'supabase', 'info.tsx');
    const frontendContent = fs.readFileSync(frontendInfoPath, 'utf8');
    
    const projectIdMatch = frontendContent.match(/projectId = "([^"]+)"/);
    const anonKeyMatch = frontendContent.match(/publicAnonKey = "([^"]+)"/);
    
    frontendProjectId = projectIdMatch ? projectIdMatch[1] : null;
    frontendAnonKey = anonKeyMatch ? anonKeyMatch[1] : null;
  } catch (error) {
    console.log(`${colors.red}❌ Could not read frontend configuration: ${error.message}${colors.reset}`);
    return;
  }

  console.log(`${colors.blue}Configuration Comparison:${colors.reset}`);
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Frontend URL: https://${frontendProjectId}.supabase.co`);
  console.log(`Backend Project ID: ${backendUrl ? backendUrl.match(/https:\/\/([^\.]+)/)?.[1] : 'N/A'}`);
  console.log(`Frontend Project ID: ${frontendProjectId}`);

  // Check if they match
  const backendProjectId = backendUrl ? backendUrl.match(/https:\/\/([^\.]+)/)?.[1] : null;
  const projectsMatch = backendProjectId === frontendProjectId;
  const keysMatch = backendAnonKey === frontendAnonKey;

  console.log(`\n${colors.blue}Alignment Check:${colors.reset}`);
  console.log(`Projects Match: ${projectsMatch ? `${colors.green}✓ YES${colors.reset}` : `${colors.red}✗ NO${colors.reset}`}`);
  console.log(`Anon Keys Match: ${keysMatch ? `${colors.green}✓ YES${colors.reset}` : `${colors.red}✗ NO${colors.reset}`}`);

  if (projectsMatch && keysMatch) {
    console.log(`\n${colors.green}${colors.bright}🎉 PERFECT ALIGNMENT!${colors.reset}`);
    console.log(`${colors.green}Frontend and backend are now using the same Supabase project.${colors.reset}\n`);

    // Test both configurations
    console.log(`${colors.yellow}Testing both configurations...${colors.reset}`);

    // Test backend configuration
    try {
      const backendSupabase = createClient(backendUrl, backendAnonKey);
      const { data: backendAuth, error: backendError } = await backendSupabase.auth.getSession();
      console.log(`Backend Connection: ${!backendError ? `${colors.green}✓ Working${colors.reset}` : `${colors.red}✗ Error: ${backendError.message}${colors.reset}`}`);
    } catch (e) {
      console.log(`Backend Connection: ${colors.red}✗ Error: ${e.message}${colors.reset}`);
    }

    // Test frontend configuration (simulated)
    try {
      const frontendUrl = `https://${frontendProjectId}.supabase.co`;
      const frontendSupabase = createClient(frontendUrl, frontendAnonKey);
      const { data: frontendAuth, error: frontendError } = await frontendSupabase.auth.getSession();
      console.log(`Frontend Connection: ${!frontendError ? `${colors.green}✓ Working${colors.reset}` : `${colors.red}✗ Error: ${frontendError.message}${colors.reset}`}`);
    } catch (e) {
      console.log(`Frontend Connection: ${colors.red}✗ Error: ${e.message}${colors.reset}`);
    }

    // Test a simple database operation
    try {
      const supabase = createClient(backendUrl, backendAnonKey);
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (!error) {
        console.log(`Database Access: ${colors.green}✓ Working (users table accessible)${colors.reset}`);
      } else {
        console.log(`Database Access: ${colors.yellow}⚠️ ${error.message}${colors.reset}`);
      }
    } catch (e) {
      console.log(`Database Access: ${colors.red}✗ Error: ${e.message}${colors.reset}`);
    }

    console.log(`\n${colors.cyan}${colors.bright}Next Steps:${colors.reset}`);
    console.log(`1. ${colors.green}✓${colors.reset} Configuration alignment complete`);
    console.log(`2. ${colors.blue}→${colors.reset} Test your application end-to-end`);
    console.log(`3. ${colors.blue}→${colors.reset} Verify user authentication flow`);
    console.log(`4. ${colors.blue}→${colors.reset} Test data synchronization between frontend and backend`);

  } else {
    console.log(`\n${colors.red}${colors.bright}❌ ALIGNMENT INCOMPLETE${colors.reset}`);
    console.log(`${colors.red}The configuration update may not have been applied correctly.${colors.reset}`);
    
    console.log(`\n${colors.yellow}Expected Values:${colors.reset}`);
    console.log(`Frontend Project ID should be: ${backendProjectId}`);
    console.log(`Frontend Anon Key should be: ${backendAnonKey}`);
  }

  console.log(`\n${colors.blue}${colors.bright}=== Verification Complete ===${colors.reset}`);
}

verifyAlignment().catch(console.error);
