# Security Configuration Guide

## Environment Variables for Enhanced Security

Create a `.env` file in your backend directory with the following security configurations:

```env
# JWT Configuration (CRITICAL - Change these values)
JWT_SECRET=your-super-secret-jwt-key-minimum-256-bits-change-this-in-production
JWT_PREVIOUS_SECRET=previous-secret-for-graceful-rotation
JWT_EXPIRE=1h
JWT_SECRET_ROTATION_DAYS=30
JWT_SECRET_LAST_ROTATION=2025-01-01T00:00:00.000Z

# Password Security
BCRYPT_ROUNDS=12

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=framtt_superadmin
DB_USER=postgres
DB_PASSWORD=secure-database-password

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
IMPERSONATION_RATE_LIMIT_MAX=10
PASSWORD_CHANGE_RATE_LIMIT_MAX=3

# Session Configuration
SESSION_TIMEOUT_HOURS=24
IMPERSONATION_TIMEOUT_HOURS=1
REFRESH_TOKEN_EXPIRY_DAYS=7

# Security Features
ENABLE_AUDIT_LOGGING=true
ENABLE_SECURITY_HEADERS=true
ENABLE_INPUT_SANITIZATION=true
ENABLE_TOKEN_BLACKLIST=true

# Monitoring and Alerts
SECURITY_ALERT_EMAIL=security@framtt.com
AUDIT_LOG_RETENTION_DAYS=90
IMPERSONATION_ALERT_THRESHOLD=10
```

## Security Checklist

### ✅ Password Security
- [x] Passwords hashed with bcrypt (12+ salt rounds)
- [x] Strong password policy enforced
- [x] Password change requires current password verification
- [x] All refresh tokens revoked on password change

### ✅ JWT Token Security
- [x] Strong JWT secret (256+ bits)
- [x] Token expiration set to 1 hour
- [x] Issuer and audience claims included
- [x] Token type validation implemented
- [x] JWT secret rotation capability added

### ✅ Impersonation Security
- [x] Limited token lifetime (1 hour)
- [x] All impersonation actions logged with:
  - Impersonator identity
  - Target user identity
  - Start/end times
  - Reason for impersonation
  - IP address and user agent
- [x] Prevention controls:
  - Cannot impersonate yourself
  - Role hierarchy enforcement
  - Only one active session per user

### ✅ Rate Limiting
- [x] General API rate limiting (100 requests/15 minutes)
- [x] Authentication rate limiting (5 attempts/15 minutes)
- [x] Impersonation rate limiting (10 attempts/hour)
- [x] Password change rate limiting (3 attempts/hour)
- [x] Admin operations rate limiting (20 requests/5 minutes)

### ✅ Audit Logging
- [x] All authentication events logged
- [x] All admin actions logged
- [x] All impersonation activities logged
- [x] Failed access attempts logged
- [x] Rate limit violations logged

### ✅ Role-Based Access Control
- [x] Role hierarchy enforced on all APIs
- [x] Middleware validation for protected routes
- [x] Account-level access control for CSMs
- [x] Impersonation permissions by role

## Security Implementation Details

### 1. Enhanced Rate Limiting

```javascript
// Applied to different endpoint categories
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/change-password', passwordChangeLimiter);
app.use('/api/impersonate', impersonationLimiter);
app.use('/api/admin', adminOperationsLimiter);
app.use('/api', generalLimiter);
```

### 2. JWT Secret Rotation

The system supports JWT secret rotation for enhanced security:

```javascript
// Check if rotation is needed (every 30 days by default)
if (jwtSecretManager.shouldRotateSecret()) {
  const rotationInfo = await jwtSecretManager.rotateSecret();
  // Update environment variables with new secret
}
```

### 3. Impersonation Token Validation

```javascript
// Impersonation tokens have additional validation
const decoded = await ImpersonationTokenManager.validateImpersonationToken(token);
// Includes checks for:
// - Token type is 'impersonation'
// - Required impersonation claims present
// - Session is still active
```

### 4. Token Blacklisting

```javascript
// Revoke tokens on logout or security events
await tokenBlacklist.addToken(tokenId, expiresAt);

// Check if token is blacklisted
if (tokenBlacklist.isBlacklisted(tokenId)) {
  // Reject the request
}
```

### 5. Security Headers

Comprehensive security headers are applied:

```javascript
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 6. Input Sanitization

All input is sanitized to remove:
- Null bytes
- Control characters
- Potential XSS payloads

## Production Deployment Security

### HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.framtt.com;
    
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Security

```sql
-- Create restricted database user
CREATE USER framtt_api WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE framtt_superadmin TO framtt_api;
GRANT USAGE ON SCHEMA public TO framtt_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO framtt_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO framtt_api;
```

### Monitoring and Alerting

Set up monitoring for:
- Failed authentication attempts
- Unusual impersonation patterns
- Rate limit violations
- JWT secret rotation needs
- Audit log anomalies

## Security Testing

Run the security verification script:

```bash
node backend/verify-security.js
```

This will check:
- All security middleware is applied
- Rate limiting is configured
- JWT secrets are strong enough
- Audit logging is working
- Password policies are enforced

## Regular Security Maintenance

1. **Weekly**:
   - Review audit logs for anomalies
   - Check rate limiting effectiveness
   - Monitor failed authentication attempts

2. **Monthly**:
   - Rotate JWT secrets
   - Review user roles and permissions
   - Update security dependencies

3. **Quarterly**:
   - Security penetration testing
   - Audit trail review
   - Update security policies
