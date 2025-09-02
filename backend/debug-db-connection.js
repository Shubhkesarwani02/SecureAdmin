#!/usr/bin/env node

// Database Connection Troubleshooting Script
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔧 Database Connection Troubleshooting Tool\n');

// Display environment variables
console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '[SET]' : '[NOT SET]');
console.log('DB_HOST:', process.env.DB_HOST || 'not set');
console.log('DB_PORT:', process.env.DB_PORT || 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'not set');
console.log('DB_USER:', process.env.DB_USER || 'not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('DB_SSL:', process.env.DB_SSL || 'not set');
console.log('');

// Test different connection methods
async function testConnections() {
  console.log('🔄 Testing connection methods...\n');

  // Method 1: Using DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('1️⃣ Testing with DATABASE_URL...');
    try {
      const pool1 = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          sslmode: 'require'
        },
        connectionTimeoutMillis: 15000,
      });
      
      const client = await pool1.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      await pool1.end();
      
      console.log('✅ DATABASE_URL connection successful!');
      console.log('   Time:', result.rows[0].current_time);
      console.log('   Version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    } catch (error) {
      console.log('❌ DATABASE_URL connection failed:');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }
  } else {
    console.log('1️⃣ DATABASE_URL not set, skipping...');
  }

  console.log('');

  // Method 2: Using individual parameters
  console.log('2️⃣ Testing with individual parameters...');
  try {
    const pool2 = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false,
        sslmode: 'require'
      } : false,
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool2.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as database');
    client.release();
    await pool2.end();
    
    console.log('✅ Individual parameters connection successful!');
    console.log('   Time:', result.rows[0].current_time);
    console.log('   Database:', result.rows[0].database);
  } catch (error) {
    console.log('❌ Individual parameters connection failed:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
  }

  console.log('');

  // Method 3: Test basic connectivity (without SSL first)
  console.log('3️⃣ Testing basic connectivity (no SSL)...');
  try {
    const pool3 = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool3.connect();
    await client.query('SELECT 1');
    client.release();
    await pool3.end();
    
    console.log('✅ Basic connectivity successful (no SSL)');
    console.log('   Note: SSL might not be required');
  } catch (error) {
    console.log('❌ Basic connectivity failed:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('   🔍 DNS resolution failed. Check if DB_HOST is correct.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   🔍 Connection refused. Check if database server is running.');
    } else if (error.code === '28P01') {
      console.log('   🔍 Authentication failed. Check username/password.');
    } else if (error.message.includes('SSL')) {
      console.log('   🔍 SSL required. Ensure DB_SSL=true is set.');
    }
  }

  console.log('');
  console.log('🏁 Troubleshooting complete!');
  console.log('');
  console.log('💡 Tips:');
  console.log('   - For Supabase, SSL is required (DB_SSL=true)');
  console.log('   - Check that all environment variables are set correctly');
  console.log('   - Verify database credentials in Supabase dashboard');
  console.log('   - Ensure your IP is allowed in Supabase network settings');
}

testConnections().catch(console.error);
