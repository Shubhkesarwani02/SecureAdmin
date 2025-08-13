const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function simulateLogin() {
  console.log('Simulating exact login process...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'framtt_superadmin',
    user: 'postgres',
    password: 'Shubh@2025'
  });

  try {
    const email = 'admin@framtt.com';
    const password = 'admin123';
    
    console.log('Step 1: Finding user by email...');
    const user = await pool.query(
      'SELECT id, email, password_hash, full_name, role, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (user.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userData = user.rows[0];
    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      status: userData.status
    });
    
    console.log('Step 2: Checking if user is active...');
    if (userData.status !== 'active') {
      console.log(`❌ User status is '${userData.status}', not 'active'`);
      return;
    }
    console.log('✅ User is active');
    
    console.log('Step 3: Verifying password...');
    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
      console.log('❌ Password does not match');
      return;
    }
    console.log('✅ Password matches');
    
    console.log('Step 4: Login should succeed!');
    console.log('✅ All login checks passed successfully');
    
    // Also test the exact query the userService.findByEmail would use
    console.log('\nTesting userService.findByEmail equivalent:');
    const serviceTest = await pool.query(`
      SELECT 
        id, email, password_hash, full_name, role, department, 
        status, created_at, updated_at, last_login 
      FROM users 
      WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (serviceTest.rows.length > 0) {
      console.log('✅ UserService query would return:', {
        id: serviceTest.rows[0].id,
        email: serviceTest.rows[0].email,
        status: serviceTest.rows[0].status,
        role: serviceTest.rows[0].role
      });
    }
    
  } catch (error) {
    console.error('❌ Error during simulation:', error.message);
  } finally {
    await pool.end();
  }
}

simulateLogin().catch(console.error);
