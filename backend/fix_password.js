const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  console.log('Fixing admin password...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'framtt_superadmin',
    user: 'postgres',
    password: 'Shubh@2025'
  });

  try {
    // Generate correct hash for admin123
    const correctHash = await bcrypt.hash('admin123', 12);
    console.log('Generated correct hash:', correctHash);
    
    // Update the user's password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role',
      [correctHash, 'admin@framtt.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully for:', result.rows[0]);
      
      // Test the password
      const user = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['admin@framtt.com']);
      const isMatch = await bcrypt.compare('admin123', user.rows[0].password_hash);
      console.log('✅ Password verification test:', isMatch ? 'PASSED' : 'FAILED');
    } else {
      console.log('❌ No user updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPassword().catch(console.error);
