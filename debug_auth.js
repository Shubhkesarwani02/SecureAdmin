const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function debugAuth() {
  console.log('Starting authentication debug...');
  
  // Test bcrypt first
  try {
    const testHash = await bcrypt.hash('admin123', 12);
    console.log('✅ bcrypt working, sample hash:', testHash);
  } catch (error) {
    console.error('❌ bcrypt error:', error.message);
    return;
  }

  // Database config - try to connect
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'framtt_superadmin',
    user: 'postgres',
    password: 'password'
  });

  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    // Check if users table exists and what users are there
    const result = await pool.query('SELECT email, password_hash, status, role FROM users WHERE email = $1', ['admin@framtt.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ No user found with email admin@framtt.com');
      
      // Check if any users exist
      try {
        const allUsers = await pool.query('SELECT email, role, status FROM users LIMIT 5');
        console.log('All users in database:', allUsers.rows);
      } catch (err) {
        console.log('❌ Users table might not exist:', err.message);
      }
      
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      status: user.status,
      hasPasswordHash: !!user.password_hash
    });
    
    // Test password verification
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('Password verification:');
    console.log('- Testing password:', testPassword);
    console.log('- Hash in DB:', user.password_hash);
    console.log('- Password match:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      // Generate a new correct hash
      const correctHash = await bcrypt.hash(testPassword, 12);
      console.log('- New correct hash:', correctHash);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Error details:', error);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

debugAuth().catch(console.error);
