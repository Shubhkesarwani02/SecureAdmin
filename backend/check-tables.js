const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables in database...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Existing tables:');
    if (result.rows.length === 0) {
      console.log('   ❌ No tables found');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check specifically for required tables
    const requiredTables = ['users', 'audit_logs', 'refresh_tokens', 'user_sessions'];
    console.log('\n🔧 Required table status:');
    
    for (const table of requiredTables) {
      const exists = result.rows.some(row => row.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
