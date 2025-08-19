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

// Passwords to set for users who don't have them
const missingPasswords = {
  'sarah@framtt.com': 'Sarah123!',      // admin role
  'john@framtt.com': 'John123!',        // csm role  
  'csm2@framtt.com': 'CSM2123!',        // csm role
  'user2@framtt.com': 'User2123!'       // user role
};

async function addMissingPasswords() {
  try {
    console.log('🔐 Adding passwords for users without them...\n');
    
    for (const [email, password] of Object.entries(missingPasswords)) {
      console.log(`Processing: ${email}`);
      
      // Generate hash for the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update the user's password
      const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role, full_name',
        [hashedPassword, email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✅ Password set for ${user.full_name} (${user.email}) - Role: ${user.role}`);
        console.log(`   Password: ${password}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
      console.log('');
    }
    
    console.log('🔍 Verifying all passwords now work...\n');
    
    // Verify all passwords (including existing ones)
    const allCredentials = {
      'superadmin@framtt.com': 'SuperAdmin123!',
      'admin@framtt.com': 'Admin123!',
      'csm1@framtt.com': 'CSM123!',
      'user1@framtt.com': 'User123!',
      ...missingPasswords
    };
    
    const allUsers = await pool.query('SELECT email, password_hash, role, full_name FROM users ORDER BY role, email');
    
    console.log('=== COMPLETE CREDENTIALS LIST ===');
    
    for (const user of allUsers.rows) {
      const testPassword = allCredentials[user.email];
      if (testPassword) {
        const isMatch = await bcrypt.compare(testPassword, user.password_hash);
        console.log(`${isMatch ? '✅' : '❌'} ${user.email} / ${testPassword} (${user.role})`);
      } else {
        console.log(`❓ ${user.email} / NO PASSWORD SET (${user.role})`);
      }
    }
    
    console.log('\n=== LOGIN READY CREDENTIALS ===');
    console.log('Copy these for your login tests:');
    console.log('');
    
    for (const [email, password] of Object.entries(allCredentials)) {
      const user = allUsers.rows.find(u => u.email === email);
      if (user) {
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${user.role}`);
        console.log(`Name: ${user.full_name}`);
        console.log('---');
      }
    }
    
    await pool.end();
    console.log('\n🎉 All users now have working passwords!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addMissingPasswords();
