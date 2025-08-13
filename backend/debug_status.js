const { Pool } = require('pg');

async function debugAccountStatus() {
  console.log('Debugging account status issue...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'framtt_superadmin',
    user: 'postgres',
    password: 'Shubh@2025'
  });

  try {
    // Check the exact user being queried
    console.log('Checking admin@framtt.com specifically:');
    const userCheck = await pool.query(
      'SELECT id, email, full_name, role, status, created_at, updated_at FROM users WHERE email = $1',
      ['admin@framtt.com']
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ admin@framtt.com not found!');
      
      // Check what emails do exist
      const allEmails = await pool.query('SELECT email FROM users ORDER BY email');
      console.log('Available emails:', allEmails.rows.map(r => r.email));
      return;
    }
    
    const user = userCheck.rows[0];
    console.log('Found user:', user);
    
    // Force update the status to active
    console.log('\nForcing status update...');
    const updateResult = await pool.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE email = $2 RETURNING *',
      ['active', 'admin@framtt.com']
    );
    
    console.log('Update result:', updateResult.rows[0]);
    
    // Verify the update worked
    const verifyResult = await pool.query(
      'SELECT email, status, updated_at FROM users WHERE email = $1',
      ['admin@framtt.com']
    );
    
    console.log('Verification:', verifyResult.rows[0]);
    
    // Check if there are any triggers or constraints that might be interfering
    console.log('\nChecking for any triggers on users table:');
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'users'
    `);
    
    if (triggers.rows.length > 0) {
      console.log('Found triggers:', triggers.rows);
    } else {
      console.log('No triggers found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

debugAccountStatus().catch(console.error);
