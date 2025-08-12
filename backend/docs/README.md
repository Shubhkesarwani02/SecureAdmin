# 📚 Backend Documentation

Comprehensive documentation for the Framtt Superadmin Backend API.

## 📁 Documentation Structure

### 🔧 Enhanced Documentation
- **[README_ENHANCED.md](README_ENHANCED.md)** - Detailed backend implementation guide
- Complete API documentation with examples
- Advanced configuration options
- Performance optimization tips

### 🔒 Security Documentation
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security implementation checklist
- **[SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)** - Security configuration guide
- Authentication and authorization setup
- Security best practices and guidelines

## 🚀 Quick Reference

### API Endpoints Overview
```
Authentication:
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Token refresh
POST   /api/auth/impersonate        # Admin impersonation

User Management:
GET    /api/users                   # List users
POST   /api/users                   # Create user
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user

Client Management:
GET    /api/clients                 # List clients
POST   /api/clients                 # Create client
PUT    /api/clients/:id             # Update client

Vehicle Management:
GET    /api/vehicles                # List vehicles
POST   /api/vehicles                # Add vehicle
PUT    /api/vehicles/:id            # Update vehicle

Dashboard:
GET    /api/dashboard/metrics       # Dashboard KPIs
GET    /api/dashboard/analytics     # Analytics data
```

### Security Features
- **JWT Authentication** with role-based access control
- **Rate Limiting** (100 requests per 15 minutes)
- **Input Validation** with sanitization
- **CORS Configuration** for cross-origin requests
- **Security Headers** (Helmet.js)
- **Request Logging** with IP tracking

### Role Hierarchy
```
SuperAdmin (Level 4)
├── Full system access
├── User management
├── Client management
└── System configuration

Admin (Level 3)
├── Client management
├── User management (limited)
└── Vehicle management

CSM (Level 2)
├── Assigned client access
├── Vehicle management
└── User support

User (Level 1)
├── Profile management
└── Basic dashboard access
```

## 🛠️ Development Tools

### Available Tools (`../tools/`)
- **generate-password.js** - Secure password generation
- **jwt-rotate.js** - JWT token rotation
- **security-audit.js** - Security vulnerability scanning
- **verify-auth.js** - Authentication testing
- **verify-security.js** - Security configuration verification

### Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:auth
npm run test:security
npm run test:api
```

## 📊 Monitoring & Logging

### Log Levels
- **ERROR** - System errors and exceptions
- **WARN** - Warning conditions
- **INFO** - General information
- **DEBUG** - Detailed debug information

### Health Checks
```
GET /api/health              # Basic health check
GET /api/health/detailed     # Detailed system status
```

## 🔗 Related Documentation

- **Main Project**: [../../README.md](../../README.md)
- **API Documentation**: [../../docs/api/](../../docs/api/)
- **Implementation Status**: [../../docs/implementation/](../../docs/implementation/)
- **Database Schema**: [../../database/](../../database/)

## 🚨 Troubleshooting

### Common Issues
1. **Authentication Failures**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Review user role assignments

2. **Database Connection Issues**
   - Verify DATABASE_URL environment variable
   - Check database service status
   - Review connection pool settings

3. **Rate Limiting**
   - Check request rate limits
   - Review IP whitelist configuration
   - Monitor rate limiting logs

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=app:* npm start

# Run with verbose logging
npm run dev:verbose
```

---

*Last Updated: August 12, 2025*
