-- Database setup script for Framtt Superadmin
-- Run this in pgAdmin Query Tool

-- Create database (if it doesn't exist)
-- CREATE DATABASE framtt_superadmin;

-- Connect to the framtt_superadmin database and run the following:

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS csm_assignments CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
    department VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    integration_code VARCHAR(50) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    user_id UUID REFERENCES users(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create CSM assignments table
CREATE TABLE csm_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    csm_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    assigned_by UUID REFERENCES users(id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user accounts table
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    role_in_account VARCHAR(50) DEFAULT 'member',
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users with bcrypt hashed passwords (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, department, status) VALUES 
('admin@framtt.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0BYj1Lz4Ou', 'Super Admin', 'superadmin', 'Management', 'active'),
('admin.user@framtt.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0BYj1Lz4Ou', 'Admin User', 'admin', 'Administration', 'active'),
('csm@framtt.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0BYj1Lz4Ou', 'Customer Success Manager', 'csm', 'Customer Success', 'active'),
('user@framtt.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0BYj1Lz4Ou', 'Regular User', 'user', 'Operations', 'active');

-- Insert a sample account
INSERT INTO accounts (name, company_name, email, integration_code, subscription_plan, created_by) VALUES 
('Test Company', 'Test Company Inc.', 'test@company.com', 'TEST001', 'premium', (SELECT id FROM users WHERE email = 'admin@framtt.com'));

-- Assign CSM to the account
INSERT INTO csm_assignments (csm_id, account_id, assigned_by, is_primary) VALUES 
((SELECT id FROM users WHERE email = 'csm@framtt.com'), 
 (SELECT id FROM accounts WHERE integration_code = 'TEST001'),
 (SELECT id FROM users WHERE email = 'admin@framtt.com'),
 true);

-- Assign regular user to the account
INSERT INTO user_accounts (user_id, account_id, role_in_account, assigned_by) VALUES 
((SELECT id FROM users WHERE email = 'user@framtt.com'),
 (SELECT id FROM accounts WHERE integration_code = 'TEST001'),
 'member',
 (SELECT id FROM users WHERE email = 'admin@framtt.com'));

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Success message
SELECT 'Database setup completed successfully!' as status;
SELECT 'Sample users created with password: admin123' as note;
SELECT email, full_name, role FROM users ORDER BY role;
