const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing database tables...');
    
    // Get all tables in the database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Check if users table exists and has proper structure
    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (usersCheck.rows[0].exists) {
      console.log('\n📋 Users table structure:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      columnsResult.rows.forEach(row => {
        console.log(`   📄 ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('\n❌ Users table does not exist!');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseTables();
