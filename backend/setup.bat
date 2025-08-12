@echo off
echo 🚀 Setting up Framtt Superadmin Backend...
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo 📋 Creating .env file...
    copy .env.template .env
    echo ✅ .env file created from template
    echo ⚠️  Please edit .env file with your actual configuration before starting the server
) else (
    echo ✅ .env file already exists
)

REM Create directories
echo.
echo 📁 Creating upload directories...
if not exist uploads mkdir uploads
if not exist logs mkdir logs
echo ✅ Upload and log directories created

REM Final instructions
echo.
echo 🎉 Setup completed successfully!
echo ==================================
echo.
echo Next steps:
echo 1. Install and setup PostgreSQL if not already done
echo 2. Create database: createdb framtt_superadmin
echo 3. Run database schema: psql -d framtt_superadmin -f ../database/10_enhanced_schema_for_impersonation.sql
echo 4. Edit .env file with your actual database connection and secrets
echo 5. Start the development server: npm run dev
echo 6. Test the API: http://localhost:5000/health
echo.
echo Default credentials (after schema setup):
echo   Superadmin: superadmin@framtt.com / password
echo   Admin: admin@framtt.com / password
echo.
echo Important: Change default passwords in production!
echo.
echo Available commands:
echo   npm start      - Start production server
echo   npm run dev    - Start development server with auto-reload
echo   npm test       - Run tests
echo.
echo Documentation: see README_ENHANCED.md for detailed information

pause
