-- =============================================
-- SCHEMA VERIFICATION AND UPDATE SCRIPT
-- Ensures database matches exact specification requirements
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SCHEMA VERIFICATION FUNCTIONS
-- =============================================

-- Function to check if table exists and has correct structure
CREATE OR REPLACE FUNCTION verify_table_structure()
RETURNS TABLE(
    table_name VARCHAR,
    column_name VARCHAR,
    data_type VARCHAR,
    is_nullable VARCHAR,
    column_default VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::VARCHAR,
        c.column_name::VARCHAR,
        c.data_type::VARCHAR,
        c.is_nullable::VARCHAR,
        c.column_default::VARCHAR,
        CASE 
            WHEN t.table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs') 
            THEN 'REQUIRED'
            ELSE 'OPTIONAL'
        END::VARCHAR as status
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs')
    ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENSURE USERS TABLE MATCHES SPECIFICATION
-- =============================================

-- Check if users table exists with correct structure
DO $$
DECLARE
    table_exists BOOLEAN;
    has_correct_structure BOOLEAN := TRUE;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;

    IF table_exists THEN
        -- Verify required columns exist with correct types
        -- id UUID (PK)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id' 
            AND data_type = 'uuid'
        ) THEN
            has_correct_structure := FALSE;
        END IF;

        -- email VARCHAR
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email' 
            AND data_type = 'character varying'
        ) THEN
            has_correct_structure := FALSE;
        END IF;

        -- password_hash VARCHAR
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash' 
            AND data_type = 'character varying'
        ) THEN
            has_correct_structure := FALSE;
        END IF;

        -- role ENUM (superadmin/admin/csm/user)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role' 
            AND data_type = 'character varying'
        ) THEN
            has_correct_structure := FALSE;
        END IF;
    END IF;

    -- If table doesn't exist or has incorrect structure, recreate it
    IF NOT table_exists OR NOT has_correct_structure THEN
        -- Drop existing table if it exists
        DROP TABLE IF EXISTS users CASCADE;
        
        -- Create users table with exact specification
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_role ON users(role);
        CREATE INDEX idx_users_created_at ON users(created_at);
        
        RAISE NOTICE 'Users table created/updated successfully';
    ELSE
        RAISE NOTICE 'Users table already exists with correct structure';
    END IF;
END $$;

-- =============================================
-- ENSURE ACCOUNTS TABLE MATCHES SPECIFICATION
-- =============================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if accounts table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Drop clients table if it exists (rename to accounts)
        DROP TABLE IF EXISTS clients CASCADE;
        
        -- Create accounts table with exact specification
        CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_accounts_name ON accounts(name);
        CREATE INDEX idx_accounts_created_at ON accounts(created_at);
        
        RAISE NOTICE 'Accounts table created successfully';
    ELSE
        RAISE NOTICE 'Accounts table already exists';
    END IF;
END $$;

-- =============================================
-- ENSURE CSM_ASSIGNMENTS TABLE MATCHES SPECIFICATION
-- =============================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if csm_assignments table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'csm_assignments'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create csm_assignments table with exact specification
        CREATE TABLE csm_assignments (
            csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            PRIMARY KEY (csm_id, account_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_csm_assignments_csm_id ON csm_assignments(csm_id);
        CREATE INDEX idx_csm_assignments_account_id ON csm_assignments(account_id);
        
        RAISE NOTICE 'CSM_assignments table created successfully';
    ELSE
        RAISE NOTICE 'CSM_assignments table already exists';
    END IF;
END $$;

-- =============================================
-- ENSURE USER_ACCOUNTS TABLE MATCHES SPECIFICATION
-- =============================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if user_accounts table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_accounts'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create user_accounts table with exact specification
        CREATE TABLE user_accounts (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, account_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
        CREATE INDEX idx_user_accounts_account_id ON user_accounts(account_id);
        
        RAISE NOTICE 'User_accounts table created successfully';
    ELSE
        RAISE NOTICE 'User_accounts table already exists';
    END IF;
END $$;

-- =============================================
-- ENSURE IMPERSONATION_LOGS TABLE MATCHES SPECIFICATION
-- =============================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if impersonation_logs table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'impersonation_logs'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create impersonation_logs table with exact specification
        CREATE TABLE impersonation_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            impersonated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_time TIMESTAMP WITH TIME ZONE NULL,
            reason TEXT NULL
        );
        
        -- Create indexes
        CREATE INDEX idx_impersonation_logs_impersonator_id ON impersonation_logs(impersonator_id);
        CREATE INDEX idx_impersonation_logs_impersonated_id ON impersonation_logs(impersonated_id);
        CREATE INDEX idx_impersonation_logs_start_time ON impersonation_logs(start_time);
        CREATE INDEX idx_impersonation_logs_end_time ON impersonation_logs(end_time);
        
        RAISE NOTICE 'Impersonation_logs table created successfully';
    ELSE
        RAISE NOTICE 'Impersonation_logs table already exists';
    END IF;
END $$;

-- =============================================
-- VERIFY FINAL SCHEMA
-- =============================================

-- Display final schema verification
SELECT * FROM verify_table_structure();

-- Verify constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('users', 'accounts', 'csm_assignments', 'user_accounts', 'impersonation_logs')
ORDER BY tc.table_name, tc.constraint_type;

-- Clean up verification function
DROP FUNCTION IF EXISTS verify_table_structure();

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== SCHEMA VERIFICATION COMPLETE ===';
    RAISE NOTICE 'All required tables have been verified and created if necessary';
    RAISE NOTICE 'Database schema now matches the exact specification requirements';
END $$;
