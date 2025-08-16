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

async function fixPasswords() {
  try {
    console.log('🔧 Fixing password hashes for all users...\n');
    
    // Generate correct hash for "admin123"
    const correctHash = await bcrypt.hash('admin123', 12);
    console.log(`Generated hash: ${correctHash}\n`);
    
    // Update all users except the one that already works
    const usersToUpdate = [
      'user1@rentalcorp.com',
      'user2@quickrentals.com', 
      'csm1@framtt.com',
      'csm2@framtt.com',
      'superadmin@framtt.com',
      'admin.user@framtt.com'
    ];
    
    for (const email of usersToUpdate) {
      try {
        const result = await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [correctHash, email]
        );
        
        if (result.rowCount > 0) {
          console.log(`✅ Updated password for: ${email}`);
        } else {
          console.log(`⚠️  User not found: ${email}`);
        }
      } catch (error) {
        console.log(`❌ Failed to update ${email}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Password fix complete!');
    console.log('All users should now be able to login with password: admin123');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPasswords();
