const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 CREATING MISSING AUDIT_LOGS TABLE');
console.log('='.repeat(40));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'framtt_superadmin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const createAuditLogsTable = async () => {
  try {
    console.log('📋 Creating audit_logs table...');
    
    // First, let's check what tables exist
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📄 Existing tables:');
    existingTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if audit_logs or system_logs already exists
    const auditTableExists = existingTables.rows.some(row => 
      row.table_name === 'audit_logs' || row.table_name === 'system_logs'
    );
    
    if (auditTableExists) {
      console.log('✅ Audit table already exists');
      return true;
    }
    
    // Create the audit_logs table (compatible with bigint user IDs)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT,
        impersonator_id BIGINT,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id BIGINT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (impersonator_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    console.log('✅ audit_logs table created successfully');
    
    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type)
    `);
    
    console.log('✅ Indexes created successfully');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error creating audit_logs table:', error.message);
    return false;
  }
};

const createSystemLogsAlias = async () => {
  try {
    // Check if we need a system_logs view/table alias
    console.log('📋 Creating system_logs alias if needed...');
    
    // Create a view that aliases audit_logs as system_logs
    await pool.query(`
      CREATE OR REPLACE VIEW system_logs AS 
      SELECT * FROM audit_logs
    `);
    
    console.log('✅ system_logs view created as alias to audit_logs');
    return true;
    
  } catch (error) {
    console.log('⚠️ Could not create system_logs alias:', error.message);
    return false;
  }
};

const runSetup = async () => {
  try {
    const auditCreated = await createAuditLogsTable();
    const aliasCreated = await createSystemLogsAlias();
    
    console.log('\n📊 SETUP SUMMARY:');
    console.log('==================');
    console.log(`🗃️ audit_logs table: ${auditCreated ? '✅ Ready' : '❌ Failed'}`);
    console.log(`🔗 system_logs alias: ${aliasCreated ? '✅ Ready' : '⚠️ Optional'}`);
    
    if (auditCreated) {
      console.log('\n🎉 Audit logging setup complete!');
      console.log('💡 You can now test login again');
    } else {
      console.log('\n❌ Setup failed - check database connection');
    }
    
  } catch (error) {
    console.log('❌ Setup error:', error.message);
  } finally {
    await pool.end();
  }
};

runSetup();
