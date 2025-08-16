const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'framtt_superadmin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Shubh@2025',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkPasswords() {
  try {
    console.log('🔍 Checking password hashes...\n');
    
    const result = await pool.query('SELECT email, password_hash, role FROM users ORDER BY created_at');
    
    console.log('Users and their password hashes:');
    console.log('================================================');
    
    for (const user of result.rows) {
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Hash: ${user.password_hash}`);
      
      // Test if "admin123" matches the hash
      const isMatch = await bcrypt.compare('admin123', user.password_hash);
      console.log(`Password "admin123" matches: ${isMatch ? '✅ YES' : '❌ NO'}`);
      console.log('---');
    }
    
    // Generate a proper hash for admin123
    console.log('\n🔧 Generating correct hash for "admin123":');
    const correctHash = await bcrypt.hash('admin123', 12);
    console.log(`Correct hash: ${correctHash}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPasswords();
