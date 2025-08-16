const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'framtt_superadmin',
  password: 'Shubh@2025',
  port: 5432,
});

async function fixAllPasswords() {
  console.log('🔧 Fixing all user passwords...');
  
  try {
    // Generate hash for 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('Generated hash:', hashedPassword);
    
    // Update all users with the new hash
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, 
          updated_at = CURRENT_TIMESTAMP
      WHERE email IN ('superadmin@framtt.com', 'admin@framtt.com', 'csm@framtt.com', 'user@framtt.com')
    `;
    
    const result = await pool.query(updateQuery, [hashedPassword]);
    console.log(`✅ Updated ${result.rowCount} user passwords`);
    
    // Verify all users
    const verifyQuery = 'SELECT id, full_name, email, role FROM users ORDER BY id';
    const users = await pool.query(verifyQuery);
    
    console.log('\n📋 Current users:');
    users.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.full_name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Test password verification
    console.log('\n🧪 Testing password verification:');
    for (const user of users.rows) {
      const userDetails = await pool.query('SELECT password_hash FROM users WHERE email = $1', [user.email]);
      const isMatch = await bcrypt.compare('admin123', userDetails.rows[0].password_hash);
      console.log(`   ${user.email}: ${isMatch ? '✅ Valid' : '❌ Invalid'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAllPasswords();
