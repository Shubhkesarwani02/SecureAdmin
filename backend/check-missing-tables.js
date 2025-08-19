// Check Missing Tables Script
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

async function checkMissingTables() {
  console.log(`${colors.blue}${colors.bright}=== Checking Missing Tables ===${colors.reset}\n`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`${colors.green}✓ Connected to database${colors.reset}\n`);

    // List of expected tables based on your application
    const expectedTables = [
      'users',
      'clients', 
      'vehicles',
      'notifications',
      'integration_codes',
      'system_logs',
      'dashboard_metrics',
      'refresh_tokens',
      'audit_logs',
      'user_sessions'
    ];

    console.log(`${colors.yellow}Checking for expected tables...${colors.reset}`);

    const missingTables = [];
    const existingTables = [];

    for (const tableName of expectedTables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [tableName]);
        
        if (result.rows[0].count > 0) {
          // Check row count
          const countResult = await client.query(`SELECT COUNT(*) as row_count FROM ${tableName}`);
          console.log(`   ${colors.green}✓ ${tableName} (${countResult.rows[0].row_count} rows)${colors.reset}`);
          existingTables.push(tableName);
        } else {
          console.log(`   ${colors.red}✗ ${tableName} (missing)${colors.reset}`);
          missingTables.push(tableName);
        }
      } catch (error) {
        console.log(`   ${colors.red}✗ ${tableName} (error: ${error.message})${colors.reset}`);
        missingTables.push(tableName);
      }
    }

    console.log(`\n${colors.blue}Summary:${colors.reset}`);
    console.log(`${colors.green}Existing tables: ${existingTables.length}${colors.reset}`);
    console.log(`${colors.red}Missing tables: ${missingTables.length}${colors.reset}`);

    if (missingTables.length > 0) {
      console.log(`\n${colors.yellow}Missing tables that need to be created:${colors.reset}`);
      missingTables.forEach(table => {
        console.log(`  - ${colors.red}${table}${colors.reset}`);
      });
      
      console.log(`\n${colors.blue}Recommendation:${colors.reset}`);
      console.log(`Run the enhanced schema SQL file to create missing tables:`);
      console.log(`${colors.cyan}psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" -f database/10_enhanced_schema_for_impersonation.sql${colors.reset}`);
    } else {
      console.log(`\n${colors.green}${colors.bright}🎉 All expected tables are present!${colors.reset}`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  } finally {
    await client.end();
  }
}

checkMissingTables().catch(console.error);
