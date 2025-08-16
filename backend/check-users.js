const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'framtt_superadmin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const result = await pool.query('SELECT id, email, full_name, role, status, created_at FROM users ORDER BY created_at');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} users:`);
      console.log('================================================');
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('   ---');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    process.exit(1);
  }
}

checkUsers();
