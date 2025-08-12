# Authentication & Authorization Implementation

## Overview

The Framtt Superadmin system implements a comprehensive JWT-based authentication system that meets enterprise security standards.

## Key Features

### 1. JWT Token-Based Authentication
- **Stateless Sessions**: No server-side session storage required
- **Self-contained Tokens**: All user information embedded in JWT
- **Token Expiry**: Configurable access token expiration (default: 1 hour)
- **Secure Signing**: Uses HMAC SHA256 with secret key

### 2. Password Security
- **bcrypt Hashing**: Passwords hashed with configurable salt rounds (default: 12)
- **Password Validation**: Enforces strong password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### 3. Refresh Token Management
- **Token Rotation**: New refresh token issued on each refresh
- **Secure Storage**: Refresh tokens stored as httpOnly cookies
- **Database Tracking**: Refresh tokens tracked with expiration and revocation
- **Automatic Cleanup**: Expired tokens automatically removed

### 4. Role-Based Access Control
- **Role Hierarchy**: superadmin > admin > csm > user
- **Middleware Protection**: Route-level role verification
- **Impersonation Support**: Admin can impersonate lower-level users

## Login Flow

1. **User Credentials Submission**
   ```javascript
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "securePassword123!"
   }
   ```

2. **Backend Validation**
   - Email format validation
   - User existence check
   - Account status verification (active/inactive)
   - Password verification using bcrypt

3. **JWT Token Generation**
   ```javascript
   // Token payload includes:
   {
     id: user.id,
     email: user.email,
     role: user.role,
     fullName: user.full_name,
     type: 'access',
     iat: timestamp,
     exp: expiration
   }
   ```

4. **Response**
   ```javascript
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "id": "uuid",
         "email": "user@example.com",
         "role": "admin",
         "fullName": "John Doe"
       }
     }
   }
   ```

## Authentication Middleware

### Token Verification Process
1. Extract Bearer token from Authorization header
2. Verify JWT signature and expiration
3. Validate token structure and required claims
4. Check user existence and active status
5. Set user context in request object

### Protected Route Example
```javascript
// Require authentication
app.use('/api/protected', verifyToken);

// Require specific role
app.use('/api/admin', verifyToken, requireRole(['admin', 'superadmin']));
```

## Security Features

### 1. Token Security
- **Strong Secret**: Minimum 256-bit secret key required
- **Short Expiration**: Access tokens expire in 1 hour
- **Issuer/Audience**: Tokens include issuer and audience claims
- **Type Validation**: Tokens must have correct type claim

### 2. Password Security
- **Secure Hashing**: bcrypt with 12+ salt rounds
- **Password Policy**: Strong password requirements enforced
- **Current Password Verification**: Required for password changes
- **Token Revocation**: All refresh tokens revoked on password change

### 3. Session Management
- **Stateless Design**: No server-side session storage
- **Refresh Token Rotation**: New refresh token on each refresh
- **Device Logout**: Ability to revoke all user tokens
- **Audit Logging**: All authentication events logged

### 4. Security Headers
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **Rate Limiting**: Request rate limiting implemented

## Environment Configuration

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-256-bits
JWT_EXPIRE=1h

# Security Configuration
BCRYPT_ROUNDS=12

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=framtt_superadmin
DB_USER=postgres
DB_PASSWORD=secure-password
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change user password

### Token Requirements
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

## Error Handling

### Authentication Errors
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Invalid credentials or input

### Example Error Response
```javascript
{
  "success": false,
  "message": "Invalid token. User not found or inactive.",
  "error": "Detailed error message (development only)"
}
```

## Audit & Logging

All authentication events are logged including:
- Login attempts (successful and failed)
- Token refresh events
- Password changes
- Logout events
- Role-based access attempts

## Testing

Comprehensive test suite covers:
- Login flow validation
- JWT token structure verification
- Password security testing
- Role-based access control
- Refresh token functionality
- Error handling scenarios

## Best Practices Implemented

1. **Secure Defaults**: Strong security configurations by default
2. **Input Validation**: All inputs validated and sanitized
3. **Error Uniformity**: Consistent error responses
4. **Audit Trail**: Complete authentication audit logging
5. **Token Hygiene**: Proper token expiration and cleanup
6. **Password Security**: Industry-standard password hashing
7. **OWASP Compliance**: Follows OWASP authentication guidelines
