# Simplified Database Schema Implementation

## Overview
This implementation ensures the database schema matches the exact specification provided, with five core tables that handle user management, account assignments, and impersonation tracking.

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'csm', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Accounts Table
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. CSM_Assignments Table
```sql
CREATE TABLE csm_assignments (
    csm_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (csm_id, account_id)
);
```

### 4. User_Accounts Table
```sql
CREATE TABLE user_accounts (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, account_id)
);
```

### 5. Impersonation_Logs Table
```sql
CREATE TABLE impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impersonator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    impersonated_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    reason TEXT NULL
);
```

## Implementation Files

### Database Layer
- **`database/simplified_schema.sql`** - Complete schema definition
- **`backend/services/database_simplified.js`** - Database service layer
- **`backend/config/database.js`** - Database connection configuration

### Controllers
- **`backend/controllers/authController_simplified.js`** - Authentication and user management
- **`backend/controllers/accountController_simplified.js`** - Account management
- **`backend/controllers/assignmentController_simplified.js`** - CSM and user-account assignments
- **`backend/controllers/impersonationController.js`** - User impersonation functionality

### Routes
- **`backend/routes/authRoutes_simplified.js`** - Authentication endpoints
- **`backend/routes/accountRoutes_simplified.js`** - Account management endpoints
- **`backend/routes/assignmentRoutes_simplified.js`** - Assignment management endpoints
- **`backend/routes/impersonationRoutes.js`** - Impersonation endpoints

### Server
- **`backend/server_simplified.js`** - Main server file with simplified schema integration

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /logout` - User logout
- `GET /verify-token` - Verify JWT token

### Accounts (`/api/accounts`)
- `POST /` - Create account (Admin+)
- `GET /` - Get all accounts
- `GET /summary` - Get accounts summary (Admin+)
- `GET /:id` - Get account by ID
- `PUT /:id` - Update account (Admin+)
- `DELETE /:id` - Delete account (Admin+)
- `GET /:id/stats` - Get account statistics

### Assignments (`/api/assignments`)
- `POST /csm` - Assign CSM to account (Admin+)
- `DELETE /csm/:csm_id/:account_id` - Remove CSM assignment (Admin+)
- `GET /csm` - Get all CSM assignments (Admin+)
- `GET /csm/:csm_id` - Get CSM's account assignments
- `POST /user-account` - Assign user to account (Admin+)
- `DELETE /user-account/:user_id/:account_id` - Remove user assignment (Admin+)
- `GET /user-account` - Get all user-account assignments (Admin+)
- `GET /user/:user_id/accounts` - Get user's accounts
- `GET /account/:account_id/users` - Get account's users
- `GET /summary` - Get assignment summary (Admin+)

### Impersonation (`/api/impersonation`)
- `POST /start` - Start impersonation session (Admin+)
- `POST /end` - End impersonation session
- `GET /status` - Get impersonation status
- `GET /logs` - Get impersonation logs (Admin+)
- `GET /history/:userId?` - Get user impersonation history
- `GET /active-sessions` - Get active sessions (Admin+)
- `POST /force-end/:sessionId` - Force end session (Superadmin)

## Role Hierarchy
1. **Superadmin** - Full system access, can manage all users and accounts
2. **Admin** - Can manage users and accounts, cannot impersonate superadmins
3. **CSM** - Customer Success Manager, assigned to specific accounts
4. **User** - Regular user, assigned to accounts

## Key Features
- **Role-based access control** with proper permission checks
- **Secure impersonation** with full audit logging
- **Account assignment management** for both CSMs and regular users
- **Comprehensive audit trails** for all administrative actions
- **JWT-based authentication** with role validation
- **Input validation and sanitization** for all endpoints
- **Error handling and logging** throughout the application

## Database Relationships
- Users can have multiple account assignments through `user_accounts`
- CSMs are specifically assigned to accounts through `csm_assignments`
- All impersonation activities are logged in `impersonation_logs`
- Foreign key constraints ensure data integrity
- Cascade deletes maintain referential integrity

## Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT tokens with appropriate expiration times
- Role-based route protection
- Impersonation session validation
- Comprehensive audit logging
- Input validation and sanitization

## Usage Instructions
1. Run the schema setup: `node -e "require('./backend/services/database_simplified').setupDatabase()"`
2. Start the simplified server: `node backend/server_simplified.js`
3. Use the API endpoints according to the role hierarchy
4. Monitor impersonation activities through the logs endpoints

This implementation provides a clean, secure, and fully functional system that matches the exact schema specification while maintaining proper security practices and comprehensive functionality.
