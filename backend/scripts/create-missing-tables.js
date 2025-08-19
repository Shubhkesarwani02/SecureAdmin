const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Checking and creating missing tables...');
    
    // Check if refresh_tokens table exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'refresh_tokens'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('⚠️ refresh_tokens table missing, creating it...');
      
      // Create refresh_tokens table compatible with existing schema
      await client.query(`
        CREATE TABLE refresh_tokens (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(256) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          is_revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Create indexes
      await client.query(`CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);`);
      await client.query(`CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);`);
      await client.query(`CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);`);
      
      console.log('✅ refresh_tokens table created successfully!');
    } else {
      console.log('✅ refresh_tokens table already exists');
    }
    
    // Check if system_logs table exists (for audit service)
    const checkSystemLogsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_logs'
      );
    `);
    
    const systemLogsExists = checkSystemLogsResult.rows[0].exists;
    
    if (!systemLogsExists) {
      console.log('⚠️ system_logs table missing, creating it...');
      
      await client.query(`
        CREATE TABLE system_logs (
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
        );
      `);
      
      await client.query(`CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);`);
      await client.query(`CREATE INDEX idx_system_logs_action ON system_logs(action);`);
      await client.query(`CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);`);
      
      console.log('✅ system_logs table created successfully!');
    } else {
      console.log('✅ system_logs table already exists');
    }
    
    console.log('🎉 All required tables are present!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  createMissingTables()
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createMissingTables };
