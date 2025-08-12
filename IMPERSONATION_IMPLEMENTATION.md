# Impersonation Feature Implementation

This document describes the complete implementation of the impersonation feature in the Framtt Superadmin application.

## Overview

The impersonation feature allows administrators and superadmins to temporarily access the system as another user for support and troubleshooting purposes. All impersonation activities are logged for security and audit purposes.

## Features Implemented

### Backend Implementation

1. **Database Schema** (`database/10_enhanced_schema_for_impersonation.sql`)
   - Enhanced users table with impersonation status fields
   - Impersonation logs table for audit trail
   - Proper indexes for performance

2. **Authentication System** (`backend/middleware/auth.js`)
   - JWT token support for impersonation
   - Role-based access control
   - Middleware for permission checking

3. **Impersonation Service** (`backend/services/database.js`)
   - Start/stop impersonation sessions
   - Permission validation
   - Activity logging
   - Session management

4. **API Endpoints** (`backend/controllers/authController.js`, `backend/routes/authRoutes.js`)
   - `POST /api/auth/impersonate/start` - Start impersonation
   - `POST /api/auth/impersonate/stop` - Stop impersonation
   - `GET /api/auth/impersonate/active` - Get active sessions
   - `GET /api/auth/impersonate/history` - Get impersonation history

### Frontend Implementation

1. **Authentication Context** (`frontend/src/contexts/AuthContext.tsx`)
   - Real authentication with JWT tokens
   - Impersonation session management
   - Token refresh and validation

2. **API Client** (`frontend/src/lib/api.ts`)
   - HTTP client with authentication
   - Impersonation API methods
   - Error handling

3. **UI Components**
   - `ImpersonationBanner.tsx` - Shows when impersonating
   - `ImpersonationDialog.tsx` - Modal for starting impersonation
   - `ImpersonationHistory.tsx` - View past impersonation sessions
   - `UserManagement.tsx` - Manage users with impersonation actions

4. **Role-Based UI** (`frontend/src/App.tsx`)
   - Menu items filtered by user role
   - Protected routes
   - Responsive navigation

## Security Rules

### Role Hierarchy and Permissions

1. **Superadmin**
   - Can impersonate anyone (including other superadmins)
   - Full access to all features
   - Can view all impersonation logs

2. **Admin**
   - Can impersonate CSMs and regular users
   - Cannot impersonate other admins or superadmins
   - Can view impersonation logs for their actions

3. **CSM (Customer Success Manager)**
   - Can impersonate regular users in assigned accounts only
   - Limited dashboard access
   - Cannot view system-wide impersonation logs

4. **User**
   - Cannot impersonate anyone
   - Basic dashboard access only

### Security Features

- **Session Limits**: Impersonation tokens expire after 1 hour
- **Audit Logging**: All impersonation activities are logged with:
  - Impersonator identity
  - Target user identity
  - Start/end times
  - Reason for impersonation
  - IP address and user agent
- **Prevention Controls**:
  - Cannot impersonate yourself
  - Cannot impersonate already impersonated users
  - Role-based permission validation

## Setup Instructions

### 1. Database Setup

```bash
# Run the database schema files in order
psql -U postgres -d framtt_superadmin -f database/10_enhanced_schema_for_impersonation.sql
psql -U postgres -d framtt_superadmin -f database/11_sample_data.sql
```

### 2. Backend Setup

```bash
cd backend
npm install

# Generate proper password hashes (optional)
node generate-password.js

# Start the server
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start the development server
npm run dev
```

### 4. Environment Configuration

Create `.env` file in the backend directory:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=framtt_superadmin
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Create `.env.local` file in the frontend directory:
```
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

## Testing the Implementation

### Sample Test Users

The system includes these test users (password: `admin123`):

1. **Super Admin**
   - Email: `admin@framtt.com`
   - Role: `superadmin`
   - Can impersonate anyone

2. **Admin User**
   - Email: `admin.user@framtt.com`
   - Role: `admin`
   - Can impersonate CSMs and users

3. **CSM User**
   - Email: `csm@framtt.com`
   - Role: `csm`
   - Can impersonate assigned users

4. **Regular User**
   - Email: `user@framtt.com`
   - Role: `user`
   - Cannot impersonate anyone

### Test Scenarios

1. **Login as Superadmin**
   - Access User Management page
   - Try impersonating different user types
   - Verify impersonation banner appears
   - Check impersonation history

2. **Login as Admin**
   - Verify can impersonate CSM and User
   - Verify cannot impersonate other admins
   - Test permission error messages

3. **Login as CSM**
   - Verify can only impersonate assigned users
   - Test account assignment restrictions

4. **Test Security Features**
   - Verify session expiration (1 hour)
   - Check audit logs are created
   - Test "stop impersonation" functionality

## API Usage Examples

### Start Impersonation

```javascript
POST /api/auth/impersonate/start
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "targetUserId": "user-uuid",
  "reason": "Customer support assistance"
}
```

### Stop Impersonation

```javascript
POST /api/auth/impersonate/stop
Content-Type: application/json
Authorization: Bearer <impersonation_token>

{
  "sessionId": "session-uuid"
}
```

### Get Impersonation History

```javascript
GET /api/auth/impersonate/history?page=1&limit=20
Authorization: Bearer <admin_token>
```

## File Structure

```
backend/
├── controllers/
│   └── authController.js          # Impersonation endpoints
├── middleware/
│   └── auth.js                    # JWT and role validation
├── routes/
│   └── authRoutes.js             # Impersonation routes
├── services/
│   └── database.js               # Impersonation service
└── generate-password.js          # Utility for password hashing

frontend/
├── src/
│   ├── components/
│   │   ├── ImpersonationBanner.tsx
│   │   ├── ImpersonationDialog.tsx
│   │   ├── ImpersonationHistory.tsx
│   │   ├── UserManagement.tsx
│   │   └── LoginPage.tsx         # Updated for real auth
│   ├── contexts/
│   │   └── AuthContext.tsx       # Enhanced with impersonation
│   └── lib/
│       └── api.ts                # API client with auth

database/
├── 10_enhanced_schema_for_impersonation.sql
└── 11_sample_data.sql
```

## Troubleshooting

### Common Issues

1. **"Invalid token" errors**
   - Check JWT_SECRET configuration
   - Verify token expiration times
   - Ensure proper token format

2. **Permission denied errors**
   - Verify user roles in database
   - Check role hierarchy rules
   - Confirm account assignments for CSMs

3. **Database connection issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database schema is properly created

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed API requests and authentication flows in the browser console.

## Security Considerations

1. **Production Deployment**
   - Use strong JWT secrets
   - Enable HTTPS for all communications
   - Set proper CORS policies
   - Implement rate limiting

2. **Monitoring**
   - Monitor impersonation logs regularly
   - Set up alerts for unusual impersonation patterns
   - Review audit trails periodically

3. **Access Control**
   - Regularly review user roles and permissions
   - Implement proper account assignment workflows
   - Use principle of least privilege

This completes the full implementation of the impersonation feature with proper security controls, audit logging, and user experience design.
