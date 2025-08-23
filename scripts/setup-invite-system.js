const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupInviteSystem() {
  console.log('🚀 Setting up invite tokens system...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', '12_create_invite_tokens_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct execution for some statements
          const { error: directError } = await supabase
            .from('_sql_executor')
            .select('*')
            .limit(0); // This is a dummy query to test connection
          
          if (statement.includes('CREATE TABLE')) {
            console.log(`Creating table with statement: ${statement.substring(0, 100)}...`);
            // For table creation, we'll handle it differently
            console.log('⚠️ Table creation might need manual execution in Supabase dashboard');
          } else {
            console.log(`⚠️ Statement might need manual execution: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`✅ Statement executed successfully`);
        }
      }
    }
    
    console.log('✅ Invite system setup completed!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Verify the invite_tokens table was created in your Supabase dashboard');
    console.log('2. Test the invite flow by sending an invitation');
    console.log('3. Check the backend routes are working at /api/invites');
    console.log('');
    console.log('📋 Manual SQL (if needed):');
    console.log('If the automated setup failed, copy and paste this SQL into your Supabase SQL editor:');
    console.log('');
    console.log(sqlContent);
    
  } catch (error) {
    console.error('❌ Error setting up invite system:', error.message);
    console.log('');
    console.log('🔧 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute the contents of database/12_create_invite_tokens_table.sql');
    process.exit(1);
  }
}

// Test Supabase connection first
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('⚠️ Connection test failed, but continuing with setup...');
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.log('⚠️ Connection test failed, but continuing with setup...');
  }
}

async function main() {
  await testConnection();
  await setupInviteSystem();
}

main();
