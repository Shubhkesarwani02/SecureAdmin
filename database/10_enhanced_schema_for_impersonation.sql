-- =============================================
-- Enhanced Database Schema for Framtt Superadmin
-- Includes role hierarchy, impersonation, and account assignments
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ENHANCED USERS TABLE WITH ROLE HIERARCHY
-- =============================================
-- Drop existing users table if it exists and recreate with enhanced structure
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    avatar TEXT,
    bio TEXT,
    permissions JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{
        "emailNotifications": true,
        "pushNotifications": false,
        "weeklyReports": true,
        "marketingEmails": false,
        "twoFactorAuth": false,
        "sessionTimeout": "8",
        "language": "en",
        "timezone": "UTC",
        "theme": "light"
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    is_impersonation_active BOOLEAN DEFAULT FALSE,
    current_impersonator_id UUID REFERENCES users(id)
);

-- =============================================
-- 2. ACCOUNTS TABLE (CUSTOMER ACCOUNTS)
-- =============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    postal_code VARCHAR(20),
    website VARCHAR(255),
    business_license VARCHAR(100),
    tax_id VARCHAR(50),
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('active', 'cancelled', 'trial', 'past_due', 'suspended')),
    subscription_amount DECIMAL(10,2) DEFAULT 99.00,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    integration_code VARCHAR(10) UNIQUE NOT NULL,
    ai_recommendation BOOLEAN DEFAULT FALSE,
    whatsapp_integration BOOLEAN DEFAULT FALSE,
    tracking_active BOOLEAN DEFAULT FALSE,
    marketing_active BOOLEAN DEFAULT FALSE,
    total_bookings INTEGER DEFAULT 0,
    active_vehicles INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- =============================================
-- 3. CSM ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE csm_assignments (
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

-- =============================================
-- 4. USER ACCOUNTS TABLE (USER TO ACCOUNT MAPPING)
-- =============================================
CREATE TABLE user_accounts (
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

-- =============================================
-- 5. IMPERSONATION LOGS TABLE
-- =============================================
CREATE TABLE impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID NOT NULL REFERENCES users(id),
    impersonated_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    actions_performed JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. AUDIT LOGS TABLE
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    impersonator_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. REFRESH TOKENS TABLE
-- =============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Accounts indexes
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_subscription_plan ON accounts(subscription_plan);
CREATE INDEX idx_accounts_integration_code ON accounts(integration_code);

-- CSM assignments indexes
CREATE INDEX idx_csm_assignments_csm_id ON csm_assignments(csm_id);
CREATE INDEX idx_csm_assignments_account_id ON csm_assignments(account_id);
CREATE INDEX idx_csm_assignments_is_primary ON csm_assignments(is_primary);

-- User accounts indexes
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_account_id ON user_accounts(account_id);

-- Impersonation logs indexes
CREATE INDEX idx_impersonation_logs_impersonator ON impersonation_logs(impersonator_id);
CREATE INDEX idx_impersonation_logs_impersonated ON impersonation_logs(impersonated_id);
CREATE INDEX idx_impersonation_logs_start_time ON impersonation_logs(start_time);
CREATE INDEX idx_impersonation_logs_is_active ON impersonation_logs(is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Refresh tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- =============================================
-- ROLE-BASED ACCESS CONTROL FUNCTIONS
-- =============================================

-- Function to check if a user can access an account
CREATE OR REPLACE FUNCTION can_user_access_account(
    p_user_id UUID,
    p_account_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR(20);
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    
    -- Superadmin and Admin can access any account
    IF v_user_role IN ('superadmin', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- CSM can access assigned accounts
    IF v_user_role = 'csm' THEN
        SELECT EXISTS(
            SELECT 1 FROM csm_assignments 
            WHERE csm_id = p_user_id AND account_id = p_account_id
        ) INTO v_has_access;
        RETURN v_has_access;
    END IF;
    
    -- Regular user can access accounts they are assigned to
    IF v_user_role = 'user' THEN
        SELECT EXISTS(
            SELECT 1 FROM user_accounts 
            WHERE user_id = p_user_id AND account_id = p_account_id
        ) INTO v_has_access;
        RETURN v_has_access;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user can manage another user
CREATE OR REPLACE FUNCTION can_user_manage_user(
    p_manager_id UUID,
    p_target_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_manager_role VARCHAR(20);
    v_target_role VARCHAR(20);
BEGIN
    -- Users can always manage themselves
    IF p_manager_id = p_target_id THEN
        RETURN TRUE;
    END IF;
    
    -- Get roles
    SELECT role INTO v_manager_role FROM users WHERE id = p_manager_id;
    SELECT role INTO v_target_role FROM users WHERE id = p_target_id;
    
    -- Superadmin can manage anyone
    IF v_manager_role = 'superadmin' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can manage CSMs and users, but not other admins or superadmins
    IF v_manager_role = 'admin' THEN
        RETURN v_target_role IN ('csm', 'user');
    END IF;
    
    -- CSMs can manage users in their assigned accounts only
    IF v_manager_role = 'csm' AND v_target_role = 'user' THEN
        RETURN EXISTS(
            SELECT 1 
            FROM csm_assignments ca
            JOIN user_accounts ua ON ca.account_id = ua.account_id
            WHERE ca.csm_id = p_manager_id AND ua.user_id = p_target_id
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check impersonation permissions
CREATE OR REPLACE FUNCTION can_user_impersonate(
    p_impersonator_id UUID,
    p_target_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_impersonator_role VARCHAR(20);
    v_target_role VARCHAR(20);
    v_target_status VARCHAR(20);
    v_target_impersonation_active BOOLEAN;
BEGIN
    -- Cannot impersonate yourself
    IF p_impersonator_id = p_target_id THEN
        RETURN FALSE;
    END IF;
    
    -- Get user details
    SELECT role INTO v_impersonator_role FROM users WHERE id = p_impersonator_id;
    SELECT role, status, is_impersonation_active 
    INTO v_target_role, v_target_status, v_target_impersonation_active 
    FROM users WHERE id = p_target_id;
    
    -- Target user must be active and not already being impersonated
    IF v_target_status != 'active' OR v_target_impersonation_active THEN
        RETURN FALSE;
    END IF;
    
    -- Superadmin can impersonate anyone
    IF v_impersonator_role = 'superadmin' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can impersonate CSMs and users, but not other admins or superadmins
    IF v_impersonator_role = 'admin' THEN
        RETURN v_target_role IN ('csm', 'user');
    END IF;
    
    -- CSMs and regular users cannot impersonate anyone
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR ENHANCED SECURITY
-- =============================================

-- Prevent impersonation of users with higher or equal roles (except for superadmin)
CREATE OR REPLACE FUNCTION prevent_unauthorized_impersonation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT can_user_impersonate(NEW.impersonator_id, NEW.impersonated_id) THEN
        RAISE EXCEPTION 'Unauthorized impersonation attempt: user % cannot impersonate user %', 
            NEW.impersonator_id, NEW.impersonated_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_unauthorized_impersonation_trigger
    BEFORE INSERT ON impersonation_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_unauthorized_impersonation();

-- Prevent unauthorized user management
CREATE OR REPLACE FUNCTION prevent_unauthorized_user_management()
RETURNS TRIGGER AS $$
BEGIN
    -- For updates, check if the updater can manage the target user
    IF TG_OP = 'UPDATE' THEN
        -- Get the user who is making the update (this would need to be set in the application context)
        -- For now, we'll just ensure basic role hierarchy
        IF OLD.role = 'superadmin' AND NEW.role != 'superadmin' THEN
            RAISE EXCEPTION 'Cannot demote superadmin user';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_unauthorized_user_management_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_unauthorized_user_management();

-- =============================================
-- VIEWS FOR ROLE-BASED DATA ACCESS
-- =============================================

-- View for users accessible by a specific user (based on role hierarchy)
CREATE OR REPLACE VIEW user_accessible_users AS
SELECT 
    u.*,
    'all_users' as access_scope
FROM users u
WHERE u.status != 'deleted';

-- View for accounts accessible by CSMs
CREATE OR REPLACE VIEW csm_accessible_accounts AS
SELECT 
    a.*,
    ca.csm_id,
    ca.is_primary
FROM accounts a
JOIN csm_assignments ca ON a.id = ca.account_id;

-- View for user accounts with proper access control
CREATE OR REPLACE VIEW user_accessible_accounts AS
SELECT 
    a.*,
    ua.user_id,
    ua.role_in_account
FROM accounts a
JOIN user_accounts ua ON a.id = ua.account_id;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csm_assignments_updated_at BEFORE UPDATE ON csm_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON user_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample superadmin user
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    department, 
    status
) VALUES (
    'superadmin@framtt.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Super Administrator',
    'superadmin',
    'IT Administration',
    'active'
);

-- Insert sample admin user
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    department, 
    status,
    created_by
) VALUES (
    'admin@framtt.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Admin User',
    'admin',
    'Customer Success',
    'active',
    (SELECT id FROM users WHERE email = 'superadmin@framtt.com')
);

-- Insert sample CSM users
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    department, 
    status,
    created_by
) VALUES 
(
    'csm1@framtt.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'CSM John Doe',
    'csm',
    'Customer Success',
    'active',
    (SELECT id FROM users WHERE email = 'admin@framtt.com')
),
(
    'csm2@framtt.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'CSM Jane Smith',
    'csm',
    'Customer Success',
    'active',
    (SELECT id FROM users WHERE email = 'admin@framtt.com')
);

-- Insert sample accounts
INSERT INTO accounts (
    name,
    company_name,
    email,
    phone,
    integration_code,
    subscription_plan,
    subscription_status,
    created_by
) VALUES 
(
    'Rental Corp Account',
    'Rental Corp LLC',
    'contact@rentalcorp.com',
    '+1-555-0123',
    'RC001',
    'premium',
    'active',
    (SELECT id FROM users WHERE email = 'admin@framtt.com')
),
(
    'Quick Rentals Account',
    'Quick Rentals Inc',
    'info@quickrentals.com',
    '+1-555-0456',
    'QR002',
    'basic',
    'trial',
    (SELECT id FROM users WHERE email = 'admin@framtt.com')
);

-- Insert CSM assignments
INSERT INTO csm_assignments (
    csm_id,
    account_id,
    assigned_by,
    is_primary
) VALUES 
(
    (SELECT id FROM users WHERE email = 'csm1@framtt.com'),
    (SELECT id FROM accounts WHERE integration_code = 'RC001'),
    (SELECT id FROM users WHERE email = 'admin@framtt.com'),
    TRUE
),
(
    (SELECT id FROM users WHERE email = 'csm2@framtt.com'),
    (SELECT id FROM accounts WHERE integration_code = 'QR002'),
    (SELECT id FROM users WHERE email = 'admin@framtt.com'),
    TRUE
);

-- Insert sample regular users
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    department, 
    status,
    created_by
) VALUES 
(
    'user1@rentalcorp.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Regular User 1',
    'user',
    'Operations',
    'active',
    (SELECT id FROM users WHERE email = 'csm1@framtt.com')
),
(
    'user2@quickrentals.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Regular User 2',
    'user',
    'Operations',
    'active',
    (SELECT id FROM users WHERE email = 'csm2@framtt.com')
);

-- Insert user account mappings
INSERT INTO user_accounts (
    user_id,
    account_id,
    role_in_account,
    assigned_by
) VALUES 
(
    (SELECT id FROM users WHERE email = 'user1@rentalcorp.com'),
    (SELECT id FROM accounts WHERE integration_code = 'RC001'),
    'member',
    (SELECT id FROM users WHERE email = 'csm1@framtt.com')
),
(
    (SELECT id FROM users WHERE email = 'user2@quickrentals.com'),
    (SELECT id FROM accounts WHERE integration_code = 'QR002'),
    'member',
    (SELECT id FROM users WHERE email = 'csm2@framtt.com')
);
