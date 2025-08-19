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

// Test credentials from test-final-verification.js
const testCredentials = {
  'superadmin@framtt.com': 'SuperAdmin123!',
  'admin@framtt.com': 'Admin123!',
  'csm1@framtt.com': 'CSM123!',
  'user1@framtt.com': 'User123!'
};

async function verifyCorrectPasswords() {
  try {
    console.log('🔍 Verifying correct login credentials...\n');
    
    const result = await pool.query('SELECT email, password_hash, role, full_name FROM users ORDER BY created_at');
    
    console.log('=== LOGIN CREDENTIALS VERIFICATION ===');
    console.log('Testing passwords from test-final-verification.js\n');
    
    for (const user of result.rows) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.full_name}`);
      console.log(`🎭 Role: ${user.role}`);
      
      // Check if we have a test password for this email
      if (testCredentials[user.email]) {
        const testPassword = testCredentials[user.email];
        const isMatch = await bcrypt.compare(testPassword, user.password_hash);
        
        if (isMatch) {
          console.log(`🔑 Password: ${testPassword} ✅ WORKS`);
          console.log(`🟢 STATUS: READY FOR LOGIN`);
        } else {
          console.log(`🔑 Expected Password: ${testPassword} ❌ DOESN'T MATCH`);
          console.log(`🔴 STATUS: PASSWORD MISMATCH`);
        }
      } else {
        console.log(`🔑 Password: Not in test credentials`);
        console.log(`🟡 STATUS: NOT IN TEST SUITE`);
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log('\n=== SUMMARY FOR LOGIN TESTING ===');
    console.log('Use these credentials for login:');
    
    for (const [email, password] of Object.entries(testCredentials)) {
      const user = result.rows.find(u => u.email === email);
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`${isMatch ? '✅' : '❌'} ${email} / ${password} (${user.role})`);
      } else {
        console.log(`❓ ${email} / ${password} (user not found in database)`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyCorrectPasswords();
