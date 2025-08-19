// Check Existing Database Schema
const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
  console.log('=== Checking Existing Database Schema ===\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check users table structure
    console.log('Checking users table structure:');
    const usersResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    if (usersResult.rows.length > 0) {
      console.log('Users table columns:');
      usersResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('Users table not found');
    }

    // Check what tables exist
    console.log('\nExisting tables:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
