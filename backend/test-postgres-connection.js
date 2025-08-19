// Direct PostgreSQL Connection Test for Supabase
const { Client } = require('pg');
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

async function testPostgreSQLConnection() {
  console.log(`${colors.blue}${colors.bright}=== Direct PostgreSQL Connection Test ===${colors.reset}\n`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`${colors.yellow}Connecting to PostgreSQL database...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}✓ Successfully connected to PostgreSQL database${colors.reset}\n`);

    // Test 1: Check PostgreSQL version
    console.log(`${colors.yellow}1. Checking PostgreSQL version...${colors.reset}`);
    const versionResult = await client.query('SELECT version()');
    console.log(`   ${colors.green}✓ PostgreSQL Version: ${versionResult.rows[0].version.split(' ')[1]}${colors.reset}`);

    // Test 2: Check current database
    console.log(`${colors.yellow}2. Checking current database...${colors.reset}`);
    const dbResult = await client.query('SELECT current_database()');
    console.log(`   ${colors.green}✓ Current Database: ${dbResult.rows[0].current_database}${colors.reset}`);

    // Test 3: List tables
    console.log(`${colors.yellow}3. Checking available tables...${colors.reset}`);
    const tablesResult = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`   ${colors.green}✓ Found ${tablesResult.rows.length} tables in public schema:${colors.reset}`);
      tablesResult.rows.forEach(row => {
        console.log(`     - ${row.tablename}`);
      });
    } else {
      console.log(`   ${colors.yellow}⚠️  No tables found in public schema${colors.reset}`);
    }

    // Test 4: Check specific project tables
    console.log(`${colors.yellow}4. Checking project-specific tables...${colors.reset}`);
    const projectTables = ['users', 'clients', 'vehicles', 'notifications', 'integration_codes', 'system_logs', 'dashboard_metrics'];
    
    for (const tableName of projectTables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [tableName]);
        
        if (result.rows[0].count > 0) {
          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) as row_count FROM ${tableName}`);
          console.log(`   ${colors.green}✓ Table '${tableName}' exists with ${countResult.rows[0].row_count} rows${colors.reset}`);
        } else {
          console.log(`   ${colors.yellow}⚠️  Table '${tableName}' does not exist${colors.reset}`);
        }
      } catch (error) {
        console.log(`   ${colors.red}✗ Error checking table '${tableName}': ${error.message}${colors.reset}`);
      }
    }

    // Test 5: Check Supabase specific schemas
    console.log(`${colors.yellow}5. Checking Supabase schemas...${colors.reset}`);
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('auth', 'storage', 'realtime', 'supabase_functions')
      ORDER BY schema_name
    `);
    
    if (schemasResult.rows.length > 0) {
      console.log(`   ${colors.green}✓ Found Supabase schemas:${colors.reset}`);
      schemasResult.rows.forEach(row => {
        console.log(`     - ${row.schema_name}`);
      });
    } else {
      console.log(`   ${colors.yellow}⚠️  No Supabase-specific schemas found${colors.reset}`);
    }

    // Test 6: Check connection limits and performance
    console.log(`${colors.yellow}6. Checking connection info...${colors.reset}`);
    const connResult = await client.query(`
      SELECT 
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        current_setting('max_connections') as max_connections
    `);
    
    console.log(`   ${colors.green}✓ Connected as user: ${connResult.rows[0].user}${colors.reset}`);
    console.log(`   ${colors.green}✓ Server: ${connResult.rows[0].server_ip}:${connResult.rows[0].server_port}${colors.reset}`);
    console.log(`   ${colors.green}✓ Max connections: ${connResult.rows[0].max_connections}${colors.reset}`);

    console.log(`\n${colors.green}${colors.bright}🎉 Direct PostgreSQL connection test completed successfully!${colors.reset}`);
    console.log(`${colors.blue}Your Supabase PostgreSQL database is accessible and working properly.${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ PostgreSQL connection test failed:${colors.reset}`);
    console.error(`Error: ${error.message}`);
    
    if (error.code) {
      console.log(`Error Code: ${error.code}`);
    }
    
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log(`1. Check if your DATABASE_URL is correct`);
    console.log(`2. Verify your Supabase project is active`);
    console.log(`3. Check if your IP is allowed in Supabase dashboard`);
    console.log(`4. Ensure your database password is correct`);
  } finally {
    await client.end();
  }
}

testPostgreSQLConnection().catch(console.error);
