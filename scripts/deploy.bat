@echo off
setlocal enabledelayedexpansion

REM Framtt Superadmin Deployment Script for Windows
REM This script helps automate the deployment process

echo 🚀 Starting Framtt Superadmin Deployment...

REM Check if required tools are installed
echo [INFO] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git.
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed!

REM Setup backend environment
echo [INFO] Setting up backend environment...

cd backend

REM Install dependencies
echo [INFO] Installing backend dependencies...
call npm install

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found. Please create one based on env.example
    echo [INFO] Copying env.example to .env...
    copy env.example .env
    echo [WARNING] Please edit .env file with your actual values before continuing
    pause
)

REM Test database connection
echo [INFO] Testing database connection...
node scripts\check-database.js
if %errorlevel% neq 0 (
    echo [ERROR] Database connection failed. Please check your .env configuration.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Database connection successful!
)

cd ..

REM Setup frontend environment
echo [INFO] Setting up frontend environment...

cd frontend

REM Install dependencies
echo [INFO] Installing frontend dependencies...
call npm install

REM Check if .env.production file exists
if not exist .env.production (
    echo [WARNING] .env.production file not found. Please create one based on env.production.example
    echo [INFO] Copying env.production.example to .env.production...
    copy env.production.example .env.production
    echo [WARNING] Please edit .env.production file with your actual values before continuing
    pause
)

REM Test build
echo [INFO] Testing frontend build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed. Please check for errors.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Frontend build successful!
)

cd ..

echo.
echo ==========================================
echo   Environment Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Deploy backend to Render
echo 2. Deploy frontend to Vercel
echo 3. Configure environment variables
echo 4. Test the deployment
echo.

set /p proceed="Do you want to proceed with deployment? (y/n): "

if /i "%proceed%"=="y" (
    REM Deploy to Render (Backend)
    echo [INFO] Deploying backend to Render...
    
    where render >nul 2>nul
    if %errorlevel% equ 0 (
        echo [INFO] Using Render CLI...
        render deploy
    ) else (
        echo [WARNING] Render CLI not found. Please deploy manually:
        echo 1. Go to https://dashboard.render.com/
        echo 2. Create a new Web Service
        echo 3. Connect your GitHub repository
        echo 4. Use the configuration from render.yaml
        echo 5. Set environment variables as specified in the deployment guide
    )
    
    REM Deploy to Vercel (Frontend)
    echo [INFO] Deploying frontend to Vercel...
    
    where vercel >nul 2>nul
    if %errorlevel% equ 0 (
        echo [INFO] Using Vercel CLI...
        cd frontend
        vercel --prod
        cd ..
    ) else (
        echo [WARNING] Vercel CLI not found. Please deploy manually:
        echo 1. Go to https://vercel.com/dashboard
        echo 2. Create a new project
        echo 3. Import your GitHub repository
        echo 4. Set root directory to 'frontend'
        echo 5. Set environment variables as specified in the deployment guide
    )
    
    echo.
    echo [SUCCESS] Deployment process completed!
    echo.
    echo Please complete the following manual steps:
    echo 1. Set environment variables in Render dashboard
    echo 2. Set environment variables in Vercel dashboard
    echo 3. Test your application
    echo 4. Configure custom domains (optional)
) else (
    echo [INFO] Deployment skipped. You can run the deployment manually later.
)

pause
