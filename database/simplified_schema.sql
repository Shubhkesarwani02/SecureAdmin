-- =============================================
-- SIMPLIFIED DATABASE SCHEMA
-- Matches exact requirements specification
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ACCOUNTS TABLE
-- =============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. CSM_ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE csm_assignments (
    csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (csm_id, account_id)
);

-- =============================================
-- 4. USER_ACCOUNTS TABLE
-- =============================================
CREATE TABLE user_accounts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, account_id)
);

-- =============================================
-- 5. IMPERSONATION_LOGS TABLE
-- =============================================
CREATE TABLE impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    impersonated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NULL,
    reason TEXT NULL
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Accounts table indexes
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- CSM assignments indexes
CREATE INDEX idx_csm_assignments_csm_id ON csm_assignments(csm_id);
CREATE INDEX idx_csm_assignments_account_id ON csm_assignments(account_id);

-- User accounts indexes
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_account_id ON user_accounts(account_id);

-- Impersonation logs indexes
CREATE INDEX idx_impersonation_logs_impersonator_id ON impersonation_logs(impersonator_id);
CREATE INDEX idx_impersonation_logs_impersonated_id ON impersonation_logs(impersonated_id);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample users
INSERT INTO users (email, password_hash, role) VALUES 
('superadmin@framtt.com', '$2b$12$example_hash_superadmin', 'superadmin'),
('admin@framtt.com', '$2b$12$example_hash_admin', 'admin'),
('csm1@framtt.com', '$2b$12$example_hash_csm1', 'csm'),
('csm2@framtt.com', '$2b$12$example_hash_csm2', 'csm'),
('user1@customer.com', '$2b$12$example_hash_user1', 'user'),
('user2@customer.com', '$2b$12$example_hash_user2', 'user');

-- Insert sample accounts
INSERT INTO accounts (name) VALUES 
('Enterprise Customer A'),
('Small Business B'),
('Medium Company C'),
('Startup D');

-- Insert sample CSM assignments
INSERT INTO csm_assignments (csm_id, account_id) VALUES 
(
    (SELECT id FROM users WHERE email = 'csm1@framtt.com'),
    (SELECT id FROM accounts WHERE name = 'Enterprise Customer A')
),
(
    (SELECT id FROM users WHERE email = 'csm1@framtt.com'),
    (SELECT id FROM accounts WHERE name = 'Small Business B')
),
(
    (SELECT id FROM users WHERE email = 'csm2@framtt.com'),
    (SELECT id FROM accounts WHERE name = 'Medium Company C')
);

-- Insert sample user accounts
INSERT INTO user_accounts (user_id, account_id) VALUES 
(
    (SELECT id FROM users WHERE email = 'user1@customer.com'),
    (SELECT id FROM accounts WHERE name = 'Enterprise Customer A')
),
(
    (SELECT id FROM users WHERE email = 'user2@customer.com'),
    (SELECT id FROM accounts WHERE name = 'Small Business B')
);

-- =============================================
-- SCHEMA VERIFICATION QUERIES
-- =============================================

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs')
ORDER BY table_name;

-- Verify foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('csm_assignments', 'user_accounts', 'impersonation_logs')
ORDER BY tc.table_name, kcu.column_name;

-- Verify indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs')
AND schemaname = 'public'
ORDER BY tablename, indexname;
