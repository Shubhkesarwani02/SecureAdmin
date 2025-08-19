// Create Missing Tables Script
const { Client } = require('pg');
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

async function createMissingTables() {
  console.log(`${colors.blue}${colors.bright}=== Creating Missing Tables ===${colors.reset}\n`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`${colors.green}✓ Connected to database${colors.reset}\n`);

    // Enable UUID extension if not exists
    console.log(`${colors.yellow}Enabling UUID extension...${colors.reset}`);
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log(`${colors.green}✓ UUID extension enabled${colors.reset}`);

    // Create refresh_tokens table (most critical for authentication)
    console.log(`${colors.yellow}Creating refresh_tokens table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        revoked_at TIMESTAMP WITH TIME ZONE,
        is_revoked BOOLEAN DEFAULT FALSE
      )
    `);
    console.log(`${colors.green}✓ refresh_tokens table created${colors.reset}`);

    // Create integration_codes table
    console.log(`${colors.yellow}Creating integration_codes table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ integration_codes table created${colors.reset}`);

    // Create system_logs table
    console.log(`${colors.yellow}Creating system_logs table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        user_id UUID REFERENCES users(id),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ system_logs table created${colors.reset}`);

    // Create dashboard_metrics table
    console.log(`${colors.yellow}Creating dashboard_metrics table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL,
        metric_data JSONB,
        date_recorded DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ dashboard_metrics table created${colors.reset}`);

    // Create audit_logs table
    console.log(`${colors.yellow}Creating audit_logs table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ audit_logs table created${colors.reset}`);

    // Create user_sessions table
    console.log(`${colors.yellow}Creating user_sessions table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log(`${colors.green}✓ user_sessions table created${colors.reset}`);

    // Create indexes for performance
    console.log(`${colors.yellow}Creating indexes...${colors.reset}`);
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active)');
    
    console.log(`${colors.green}✓ Indexes created${colors.reset}`);

    // Verify all tables were created
    console.log(`\n${colors.yellow}Verifying tables...${colors.reset}`);
    const tables = ['refresh_tokens', 'integration_codes', 'system_logs', 'dashboard_metrics', 'audit_logs', 'user_sessions'];
    
    for (const tableName of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [tableName]);
      
      if (result.rows[0].count > 0) {
        console.log(`   ${colors.green}✓ ${tableName} verified${colors.reset}`);
      } else {
        console.log(`   ${colors.red}✗ ${tableName} failed to create${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}${colors.bright}🎉 All missing tables have been created successfully!${colors.reset}`);
    console.log(`${colors.blue}Your backend authentication should now work properly.${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ Error creating tables: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    await client.end();
  }
}

createMissingTables().catch(console.error);
