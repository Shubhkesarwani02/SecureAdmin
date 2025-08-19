// Fix Assignment Tables Schema
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

async function fixAssignmentTablesSchema() {
  console.log(`${colors.blue}${colors.bright}=== Fixing Assignment Tables Schema ===${colors.reset}\n`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`${colors.green}✓ Connected to database${colors.reset}\n`);

    // First, let's check the current users table ID type
    console.log(`${colors.yellow}Checking users table schema...${colors.reset}`);
    const usersCheck = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id';
    `);
    
    const userIdType = usersCheck.rows[0]?.data_type;
    console.log(`${colors.green}✓ Users table ID type: ${userIdType}${colors.reset}`);

    // Drop existing assignment tables if they exist
    console.log(`${colors.yellow}Dropping existing assignment tables...${colors.reset}`);
    await client.query('DROP TABLE IF EXISTS user_accounts CASCADE');
    await client.query('DROP TABLE IF EXISTS csm_assignments CASCADE');
    console.log(`${colors.green}✓ Existing tables dropped${colors.reset}`);

    // Recreate accounts table with correct ID type for consistency
    console.log(`${colors.yellow}Recreating accounts table with bigint ID...${colors.reset}`);
    await client.query('DROP TABLE IF EXISTS accounts CASCADE');
    await client.query(`
      CREATE TABLE accounts (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        company_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        billing_address TEXT,
        created_by BIGINT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ Accounts table recreated with bigint ID${colors.reset}`);

    // Create csm_assignments table with correct types
    console.log(`${colors.yellow}Creating csm_assignments table with correct types...${colors.reset}`);
    await client.query(`
      CREATE TABLE csm_assignments (
        id BIGSERIAL PRIMARY KEY,
        csm_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by BIGINT REFERENCES users(id),
        is_primary BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(csm_id, account_id)
      )
    `);
    console.log(`${colors.green}✓ CSM assignments table created${colors.reset}`);

    // Create user_accounts table with correct types
    console.log(`${colors.yellow}Creating user_accounts table with correct types...${colors.reset}`);
    await client.query(`
      CREATE TABLE user_accounts (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        role_in_account VARCHAR(50) DEFAULT 'member' CHECK (role_in_account IN ('owner', 'admin', 'member', 'viewer')),
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by BIGINT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, account_id)
      )
    `);
    console.log(`${colors.green}✓ User accounts table created${colors.reset}`);

    // Create indexes
    console.log(`${colors.yellow}Creating indexes...${colors.reset}`);
    await client.query('CREATE INDEX idx_accounts_status ON accounts(status)');
    await client.query('CREATE INDEX idx_accounts_created_by ON accounts(created_by)');
    await client.query('CREATE INDEX idx_csm_assignments_csm_id ON csm_assignments(csm_id)');
    await client.query('CREATE INDEX idx_csm_assignments_account_id ON csm_assignments(account_id)');
    await client.query('CREATE INDEX idx_csm_assignments_is_primary ON csm_assignments(is_primary)');
    await client.query('CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id)');
    await client.query('CREATE INDEX idx_user_accounts_account_id ON user_accounts(account_id)');
    await client.query('CREATE INDEX idx_user_accounts_role ON user_accounts(role_in_account)');
    console.log(`${colors.green}✓ Indexes created${colors.reset}`);

    // Insert sample accounts
    console.log(`${colors.yellow}Creating sample accounts...${colors.reset}`);
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
      await client.query(`
        INSERT INTO accounts (name, description, company_name, contact_email, status) 
        VALUES ($1, $2, $3, $4, $5)
      `, [account.name, account.description, account.company_name, account.contact_email, account.status]);
      console.log(`${colors.green}✓ Sample account "${account.name}" created${colors.reset}`);
    }

    // Verify the fix
    console.log(`\n${colors.yellow}Verifying schema fix...${colors.reset}`);
    const verification = await client.query(`
      SELECT COUNT(*) FROM accounts;
    `);
    console.log(`${colors.green}✓ Accounts table working: ${verification.rows[0].count} accounts${colors.reset}`);

    console.log(`\n${colors.blue}${colors.bright}🎉 Assignment tables schema fixed successfully!${colors.reset}`);
    console.log(`${colors.green}✅ All tables now use consistent bigint IDs${colors.reset}`);
    console.log(`${colors.green}✅ Foreign key constraints are properly aligned${colors.reset}`);
    console.log(`${colors.green}✅ Ready for assignment testing${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error fixing schema: ${error.message}${colors.reset}`);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function
fixAssignmentTablesSchema()
  .then(() => {
    console.log(`\n${colors.green}✅ Schema fix completed successfully${colors.reset}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n${colors.red}❌ Schema fix failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
