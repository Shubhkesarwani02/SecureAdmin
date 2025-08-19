const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseSchema() {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');
    
    // Get all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) throw error;
    
    console.log('Existing tables:');
    tables.forEach(table => console.log(`  ✓ ${table.table_name}`));
    
    // Check specific required tables from attachment
    const requiredTables = ['users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs'];
    
    console.log('\n=== VERIFYING REQUIRED TABLES ===');
    for (const tableName of requiredTables) {
      const tableExists = tables.find(t => t.table_name === tableName);
      if (tableExists) {
        // Get table structure
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', tableName)
          .order('ordinal_position');
        
        console.log(`\n📋 ${tableName.toUpperCase()} TABLE:`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
          const defaultVal = col.column_default ? ` default: ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
      } else {
        console.log(`\n❌ Missing table: ${tableName}`);
      }
    }
    
    // Check for any sample data
    console.log('\n=== CHECKING SAMPLE DATA ===');
    for (const tableName of requiredTables) {
      if (tables.find(t => t.table_name === tableName)) {
        const { data, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0);
        
        console.log(`${tableName}: ${count || 0} records`);
      }
    }
    
  } catch (error) {
    console.error('Database schema check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseSchema();
