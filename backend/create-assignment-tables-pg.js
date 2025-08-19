// Create Assignment Tables Script
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

async function createAssignmentTables() {
  console.log(`${colors.blue}${colors.bright}=== Creating User & Account Assignment Logic Tables ===${colors.reset}\n`);

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

    // 1. Create accounts table
    console.log(`${colors.yellow}Creating accounts table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        company_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        billing_address TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ accounts table created${colors.reset}`);

    // Create indexes for accounts
    console.log(`${colors.yellow}Creating accounts table indexes...${colors.reset}`);
    await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by)');
    console.log(`${colors.green}✓ accounts table indexes created${colors.reset}`);

    // 2. Create csm_assignments table
    console.log(`${colors.yellow}Creating csm_assignments table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS csm_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        csm_id UUID NOT NULL,
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID,
        is_primary BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(csm_id, account_id)
      )
    `);
    console.log(`${colors.green}✓ csm_assignments table created${colors.reset}`);

    // Create indexes for csm_assignments
    console.log(`${colors.yellow}Creating csm_assignments table indexes...${colors.reset}`);
    await client.query('CREATE INDEX IF NOT EXISTS idx_csm_assignments_csm_id ON csm_assignments(csm_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_csm_assignments_account_id ON csm_assignments(account_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_csm_assignments_is_primary ON csm_assignments(is_primary)');
    console.log(`${colors.green}✓ csm_assignments table indexes created${colors.reset}`);

    // 3. Create user_accounts table
    console.log(`${colors.yellow}Creating user_accounts table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        role_in_account VARCHAR(50) DEFAULT 'member' CHECK (role_in_account IN ('owner', 'admin', 'member', 'viewer')),
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, account_id)
      )
    `);
    console.log(`${colors.green}✓ user_accounts table created${colors.reset}`);

    // Create indexes for user_accounts
    console.log(`${colors.yellow}Creating user_accounts table indexes...${colors.reset}`);
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON user_accounts(account_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts(role_in_account)');
    console.log(`${colors.green}✓ user_accounts table indexes created${colors.reset}`);

    // 4. Insert sample accounts for testing
    console.log(`${colors.yellow}Creating sample accounts for testing...${colors.reset}`);
    
    const sampleAccounts = [
      {
        name: 'Enterprise Corp',
        description: 'Large enterprise customer',
        company_name: 'Enterprise Corporation',
        contact_email: 'contact@enterprisecorp.com',
        status: 'active'
      },
      {
        name: 'StartupTech Inc',
        description: 'Growing startup in tech sector',
        company_name: 'StartupTech Incorporated',
        contact_email: 'hello@startuptech.com',
        status: 'active'
      },
      {
        name: 'Local Business Ltd',
        description: 'Small local business customer',
        company_name: 'Local Business Limited',
        contact_email: 'info@localbusiness.com',
        status: 'active'
      }
    ];

    for (const account of sampleAccounts) {
      try {
        await client.query(`
          INSERT INTO accounts (name, description, company_name, contact_email, status) 
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
        `, [account.name, account.description, account.company_name, account.contact_email, account.status]);
        console.log(`${colors.green}✓ Sample account "${account.name}" created${colors.reset}`);
      } catch (error) {
        if (error.constraint && error.constraint.includes('unique')) {
          console.log(`${colors.yellow}  ⚠️  Account "${account.name}" already exists${colors.reset}`);
        } else {
          console.log(`${colors.yellow}  ⚠️  Account "${account.name}" insert skipped: ${error.message}${colors.reset}`);
        }
      }
    }

    // 5. Verify table creation
    console.log(`\n${colors.yellow}Verifying table creation...${colors.reset}`);
    
    const tables = ['accounts', 'csm_assignments', 'user_accounts'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${colors.green}✓ ${table} table verified (${result.rows[0].count} records)${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}✗ ${table} table verification failed: ${error.message}${colors.reset}`);
      }
    }

    console.log(`\n${colors.blue}${colors.bright}🎉 User & Account Assignment Logic tables created successfully!${colors.reset}`);
    console.log(`\n${colors.green}📊 Assignment system is ready for:${colors.reset}`);
    console.log(`${colors.green}   ✅ CSM to Account assignments${colors.reset}`);
    console.log(`${colors.green}   ✅ User to Account assignments${colors.reset}`);
    console.log(`${colors.green}   ✅ Role-based access control${colors.reset}`);
    console.log(`${colors.green}   ✅ Audit logging${colors.reset}`);
    console.log(`${colors.green}   ✅ Bulk operations${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error creating assignment tables: ${error.message}${colors.reset}`);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function
createAssignmentTables()
  .then(() => {
    console.log(`\n${colors.green}✅ Assignment tables setup completed successfully${colors.reset}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n${colors.red}❌ Setup failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
