# 🚀 Project Scripts

This directory contains utility scripts for development, testing, and deployment of the Framtt Superadmin Dashboard.

## 📁 Script Categories

### 🖥️ Development Scripts

#### Windows Development
- **`dev-windows.bat`** - Windows development environment setup
- **`start.bat`** - Start the application on Windows

#### Cross-Platform Development  
- **`start.sh`** - Start the application on Unix/Linux/macOS

### 🧪 Testing & Verification Scripts

#### API Testing
- **`verify-endpoints.js`** - Verify all API endpoints are working
  ```bash
  node scripts/verify-endpoints.js
  ```

#### Authorization Testing
- **`test-authorization.js`** - Test role-based access control
  ```bash
  node scripts/test-authorization.js
  ```

## 🚀 Quick Start

### For Windows Development
```batch
# Setup and start development environment
scripts\dev-windows.bat

# Or just start the application
scripts\start.bat
```

### For Unix/Linux/macOS Development
```bash
# Make script executable and run
chmod +x scripts/start.sh
./scripts/start.sh
```

### Run Tests
```bash
# Verify all endpoints
node scripts/verify-endpoints.js

# Test authorization system
node scripts/test-authorization.js
```

## 📋 Script Requirements

### Environment Setup
Most scripts require these environment variables:
```bash
NODE_ENV=development
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
PORT=3001
```

### Dependencies
Ensure you have installed dependencies in both frontend and backend:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd frontend && npm install
```

## 🔧 Script Configuration

### Development Environment
The development scripts will:
1. Start the backend server on port 3001
2. Start the frontend development server on port 5173
3. Open browser automatically (frontend only)
4. Enable hot reloading for both services

### Testing Scripts
Testing scripts will:
1. Connect to the configured database
2. Run comprehensive endpoint verification
3. Test authentication and authorization
4. Generate test reports

## 📊 Script Output

### Development Scripts
- Backend logs will show server startup and API requests
- Frontend logs will show Vite development server output
- Both services will restart automatically on file changes

### Testing Scripts  
- Detailed test results with pass/fail status
- Performance metrics for each endpoint
- Security verification results
- Error logs for failed tests

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
If you encounter port conflicts:
```bash
# Check what's using the ports
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill processes if needed (Windows)
taskkill /PID <process_id> /F
```

#### Environment Variables
If scripts fail due to missing environment variables:
1. Copy `.env.example` to `.env` in both backend and frontend
2. Fill in the required values
3. Restart the scripts

#### Database Connection
If database connection fails:
1. Verify DATABASE_URL is correct
2. Ensure database service is running
3. Check network connectivity

### Debug Mode
Run scripts with debug output:
```bash
# Windows
set DEBUG=* && scripts\start.bat

# Unix/Linux/macOS
DEBUG=* ./scripts/start.sh
```

## 🔗 Related Documentation

- **Backend Setup**: [../backend/README.md](../backend/README.md)
- **Frontend Setup**: [../frontend/README.md](../frontend/README.md)
- **Database Setup**: [../database/README.md](../database/README.md)
- **Deployment**: [../deployment/README.md](../deployment/README.md)

---

*For additional help with any script, check the comments at the top of each script file.*
