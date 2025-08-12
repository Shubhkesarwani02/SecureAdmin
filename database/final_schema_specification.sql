-- =============================================
-- FINAL DATABASE SCHEMA SPECIFICATION
-- Matches the exact requirements provided
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
-- Drop existing users table if it exists and recreate with exact specification
DROP TABLE IF EXISTS users CASCADE;

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
-- Drop existing accounts/clients table if it exists and recreate
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. CSM_ASSIGNMENTS TABLE
-- =============================================
-- Drop existing table if it exists and recreate
DROP TABLE IF EXISTS csm_assignments CASCADE;

CREATE TABLE csm_assignments (
    csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (csm_id, account_id)
);

-- =============================================
-- 4. USER_ACCOUNTS TABLE
-- =============================================
-- Drop existing table if it exists and recreate
DROP TABLE IF EXISTS user_accounts CASCADE;

CREATE TABLE user_accounts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, account_id)
);

-- =============================================
-- 5. IMPERSONATION_LOGS TABLE
-- =============================================
-- Drop existing table if it exists and recreate
DROP TABLE IF EXISTS impersonation_logs CASCADE;

CREATE TABLE impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    impersonated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NULL,
    reason TEXT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
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
CREATE INDEX idx_impersonation_logs_start_time ON impersonation_logs(start_time);
CREATE INDEX idx_impersonation_logs_end_time ON impersonation_logs(end_time);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample users
INSERT INTO users (id, email, password_hash, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'superadmin@framtt.com', '$2b$10$hashedpassword1', 'superadmin'),
    ('550e8400-e29b-41d4-a716-446655440002', 'admin@framtt.com', '$2b$10$hashedpassword2', 'admin'),
    ('550e8400-e29b-41d4-a716-446655440003', 'csm1@framtt.com', '$2b$10$hashedpassword3', 'csm'),
    ('550e8400-e29b-41d4-a716-446655440004', 'csm2@framtt.com', '$2b$10$hashedpassword4', 'csm'),
    ('550e8400-e29b-41d4-a716-446655440005', 'user1@company1.com', '$2b$10$hashedpassword5', 'user'),
    ('550e8400-e29b-41d4-a716-446655440006', 'user2@company1.com', '$2b$10$hashedpassword6', 'user'),
    ('550e8400-e29b-41d4-a716-446655440007', 'user3@company2.com', '$2b$10$hashedpassword7', 'user');

-- Insert sample accounts
INSERT INTO accounts (id, name) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Acme Rental Company'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Beta Car Rentals'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Gamma Vehicle Services'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Delta Fleet Management');

-- Insert sample CSM assignments
INSERT INTO csm_assignments (csm_id, account_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003'),
    ('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004');

-- Insert sample user account assignments
INSERT INTO user_accounts (user_id, account_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002');

-- Insert sample impersonation logs
INSERT INTO impersonation_logs (impersonator_id, impersonated_id, start_time, end_time, reason) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'Troubleshooting user account issue'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'User requested assistance with settings'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 
     NOW() - INTERVAL '30 minutes', NULL, 'Active support session');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs')
ORDER BY table_name, ordinal_position;

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
    AND tc.table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs');

-- Verify sample data counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'accounts' as table_name, COUNT(*) as row_count FROM accounts
UNION ALL
SELECT 'csm_assignments' as table_name, COUNT(*) as row_count FROM csm_assignments
UNION ALL
SELECT 'user_accounts' as table_name, COUNT(*) as row_count FROM user_accounts
UNION ALL
SELECT 'impersonation_logs' as table_name, COUNT(*) as row_count FROM impersonation_logs;
