const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAssignmentTables() {
  console.log('🔧 Creating User & Account Assignment Logic tables...');

  try {
    // 1. First, let's check if accounts table exists
    console.log('\n📋 Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);

    if (accountsError && accountsError.code === 'PGRST116') {
      console.log('❌ Accounts table missing. Creating accounts table...');
      
      // Create accounts table
      const { error: createAccountsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            company_name VARCHAR(255),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(50),
            billing_address TEXT,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX idx_accounts_status ON accounts(status);
          CREATE INDEX idx_accounts_created_by ON accounts(created_by);
        `
      });

      if (createAccountsError) {
        console.error('❌ Error creating accounts table:', createAccountsError);
        throw createAccountsError;
      }
      console.log('✅ Accounts table created successfully');
    } else {
      console.log('✅ Accounts table already exists');
    }

    // 2. Create csm_assignments table
    console.log('\n📋 Creating csm_assignments table...');
    const { error: csmAssignmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS csm_assignments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          assigned_by UUID REFERENCES users(id),
          is_primary BOOLEAN DEFAULT FALSE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(csm_id, account_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_csm_assignments_csm_id ON csm_assignments(csm_id);
        CREATE INDEX IF NOT EXISTS idx_csm_assignments_account_id ON csm_assignments(account_id);
        CREATE INDEX IF NOT EXISTS idx_csm_assignments_is_primary ON csm_assignments(is_primary);
      `
    });

    if (csmAssignmentsError) {
      console.error('❌ Error creating csm_assignments table:', csmAssignmentsError);
      throw csmAssignmentsError;
    }
    console.log('✅ CSM assignments table created successfully');

    // 3. Create user_accounts table
    console.log('\n📋 Creating user_accounts table...');
    const { error: userAccountsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_accounts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          role_in_account VARCHAR(50) DEFAULT 'member' CHECK (role_in_account IN ('owner', 'admin', 'member', 'viewer')),
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          assigned_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, account_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON user_accounts(account_id);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts(role_in_account);
      `
    });

    if (userAccountsError) {
      console.error('❌ Error creating user_accounts table:', userAccountsError);
      throw userAccountsError;
    }
    console.log('✅ User accounts table created successfully');

    // 4. Create some sample accounts for testing
    console.log('\n📋 Creating sample accounts for testing...');
    
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
      const { error: insertError } = await supabase
        .from('accounts')
        .insert(account);
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('Error creating sample account:', insertError);
      } else {
        console.log(`✅ Sample account "${account.name}" created`);
      }
    }

    console.log('\n🎉 All User & Account Assignment Logic tables created successfully!');
    console.log('\n📊 Next steps:');
    console.log('   1. Test assignment functionality');
    console.log('   2. Verify role-based access control');
    console.log('   3. Test impersonation with assignments');

  } catch (error) {
    console.error('❌ Error creating assignment tables:', error);
    throw error;
  }
}

// Run the function
createAssignmentTables()
  .then(() => {
    console.log('\n✅ Assignment tables setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
