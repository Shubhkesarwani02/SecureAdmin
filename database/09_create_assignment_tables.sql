-- User & Account Assignment Logic Tables
-- This script creates the required tables for managing CSM and user assignments to accounts

-- First, create accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS accounts (
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

-- Create indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);

-- Create csm_assignments table
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

-- Create indexes for csm_assignments table
CREATE INDEX IF NOT EXISTS idx_csm_assignments_csm_id ON csm_assignments(csm_id);
CREATE INDEX IF NOT EXISTS idx_csm_assignments_account_id ON csm_assignments(account_id);
CREATE INDEX IF NOT EXISTS idx_csm_assignments_is_primary ON csm_assignments(is_primary);

-- Create user_accounts table
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

-- Create indexes for user_accounts table
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON user_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts(role_in_account);

-- Insert sample accounts for testing
INSERT INTO accounts (name, description, company_name, contact_email, status) VALUES 
('Enterprise Corp', 'Large enterprise customer', 'Enterprise Corporation', 'contact@enterprisecorp.com', 'active'),
('StartupTech Inc', 'Growing startup in tech sector', 'StartupTech Incorporated', 'hello@startuptech.com', 'active'),
('Local Business Ltd', 'Small local business customer', 'Local Business Limited', 'info@localbusiness.com', 'active')
ON CONFLICT (name) DO NOTHING;
