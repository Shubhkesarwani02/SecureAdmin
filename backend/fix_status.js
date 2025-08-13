const { Pool } = require('pg');

async function fixAccountStatus() {
  console.log('Checking and fixing account status...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'framtt_superadmin',
    user: 'postgres',
    password: 'Shubh@2025'
  });

  try {
    // Check current status
    const currentUser = await pool.query(
      'SELECT email, role, status, created_at FROM users WHERE email = $1',
      ['admin@framtt.com']
    );
    
    if (currentUser.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = currentUser.rows[0];
    console.log('Current user status:', {
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    });
    
    if (user.status !== 'active') {
      console.log('🔧 Updating status to active...');
      
      const result = await pool.query(
        'UPDATE users SET status = $1 WHERE email = $2 RETURNING email, role, status',
        ['active', 'admin@framtt.com']
      );
      
      console.log('✅ Status updated:', result.rows[0]);
    } else {
      console.log('✅ User is already active');
    }
    
    // Also check if there are any other admin/superadmin users
    const allAdmins = await pool.query(
      "SELECT email, role, status FROM users WHERE role IN ('admin', 'superadmin') ORDER BY email"
    );
    
    console.log('\nAll admin users:');
    allAdmins.rows.forEach(admin => {
      console.log(`- ${admin.email}: ${admin.role} (${admin.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAccountStatus().catch(console.error);
