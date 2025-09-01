# FRAMTT Superadmin Deployment Preparation Script (PowerShell)
# This script helps prepare your application for deployment

Write-Host "🚀 FRAMTT Superadmin Deployment Preparation" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "README.md") -or -not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Create deployment directories
New-Item -ItemType Directory -Force -Path "deployment\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "deployment\frontend" | Out-Null

# Backend preparation
Write-Host "📦 Preparing backend for deployment..." -ForegroundColor Yellow

# Copy backend environment template
Copy-Item "backend\.env" "backend\.env.production.template"
Write-Host "✅ Created backend\.env.production.template" -ForegroundColor Green

# Create backend deployment checklist
@"
# Backend Deployment Checklist for Render

## Pre-deployment Setup
- [ ] Update `.env.production` with production values
- [ ] Verify all dependencies are in package.json
- [ ] Test build locally: `npm install && npm start`
- [ ] Verify database connection string

## Render Configuration
- [ ] Service Name: `framtt-superadmin-backend`
- [ ] Environment: `Node`
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Environment Variables: Copy from `.env.production`

## Post-deployment
- [ ] Test health endpoint: `/api/health`
- [ ] Verify database connection
- [ ] Update CORS origins with frontend URL
- [ ] Test authentication endpoints

## Important URLs
- Health Check: `https://your-service.onrender.com/api/health`
- API Base: `https://your-service.onrender.com/api`
"@ | Out-File -FilePath "deployment\backend\deploy-checklist.md" -Encoding UTF8

# Frontend preparation
Write-Host "📦 Preparing frontend for deployment..." -ForegroundColor Yellow

# Create frontend environment template
Copy-Item "frontend\.env" "frontend\.env.production.template"
Write-Host "✅ Created frontend\.env.production.template" -ForegroundColor Green

# Update vercel.json template
@"
{
  "buildCommand": "npm run build:legacy",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_BACKEND_URL.onrender.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
"@ | Out-File -FilePath "deployment\frontend\vercel.json.template" -Encoding UTF8

# Create frontend deployment checklist
@"
# Frontend Deployment Checklist for Vercel

## Pre-deployment Setup
- [ ] Update `.env.production` with production API URL
- [ ] Update `vercel.json` with backend URL
- [ ] Test build locally: `npm run build:legacy`
- [ ] Verify all environment variables start with `VITE_`

## Vercel Configuration
- [ ] Framework Preset: `Vite`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build:legacy`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install --legacy-peer-deps`
- [ ] Environment Variables: Copy from `.env.production`

## Post-deployment
- [ ] Test application loading
- [ ] Verify API connection
- [ ] Test authentication flow
- [ ] Check all dashboard features

## Important URLs
- Application: `https://your-app.vercel.app`
- Admin Login: `https://your-app.vercel.app/login`
"@ | Out-File -FilePath "deployment\frontend\deploy-checklist.md" -Encoding UTF8

# Create environment variables template
@"
# Environment Variables for Production

## Backend (Render)
```env
# Database Configuration - Supabase
DB_HOST=db.wqpkqjxsuqburhksoafb.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Shubh@2025#123
DB_SSL=true

DATABASE_URL=postgresql://postgres:Shubh%402025%23123@db.wqpkqjxsuqburhksoafb.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://wqpkqjxsuqburhksoafb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw

# JWT Configuration - GENERATE NEW SECRETS FOR PRODUCTION
JWT_SECRET=GENERATE_NEW_64_CHAR_SECRET
JWT_PREVIOUS_SECRET=GENERATE_NEW_64_CHAR_SECRET
JWT_REFRESH_SECRET=GENERATE_NEW_64_CHAR_SECRET
JWT_EXPIRE=1h
JWT_SECRET_ROTATION_DAYS=30
JWT_SECRET_LAST_ROTATION=2025-09-02T00:00:00.000Z

# Server Configuration
NODE_ENV=production
PORT=10000

# Security Configuration
BCRYPT_ROUNDS=12

# CORS Configuration - UPDATE WITH YOUR VERCEL DOMAIN
ALLOWED_ORIGINS=https://your-app-name.vercel.app

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
SECURITY_ALERT_EMAIL=admin@framtt.com
AUDIT_LOG_RETENTION_DAYS=90
IMPERSONATION_ALERT_THRESHOLD=10

# Admin Configuration
SUPERADMIN_EMAIL=admin@framtt.com
SUPERADMIN_PASSWORD=SecurePassword123!
```

## Frontend (Vercel)
```env
# API Configuration - UPDATE WITH YOUR RENDER URL
VITE_API_URL=https://your-backend-url.onrender.com/api

# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=wqpkqjxsuqburhksoafb
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw

# Production Mode
VITE_DEMO_MODE=false
```
"@ | Out-File -FilePath "deployment\environment-variables.md" -Encoding UTF8

# Create quick deployment PowerShell script
@"
# Quick Deployment Script (PowerShell)

Write-Host "🚀 Quick Deployment Script" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

Write-Host "1. Generate new JWT secrets for production:" -ForegroundColor Yellow
Write-Host "Run this command and update your environment variables:" -ForegroundColor White
Write-Host "node -e `"console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_PREVIOUS_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'));`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Backend Deployment (Render):" -ForegroundColor Yellow
Write-Host "   - Go to render.com" -ForegroundColor White
Write-Host "   - Connect GitHub repository" -ForegroundColor White
Write-Host "   - Set root directory: backend" -ForegroundColor White
Write-Host "   - Copy environment variables from deployment\environment-variables.md" -ForegroundColor White

Write-Host ""
Write-Host "3. Frontend Deployment (Vercel):" -ForegroundColor Yellow
Write-Host "   - Go to vercel.com" -ForegroundColor White
Write-Host "   - Connect GitHub repository" -ForegroundColor White
Write-Host "   - Set root directory: frontend" -ForegroundColor White
Write-Host "   - Copy environment variables from deployment\environment-variables.md" -ForegroundColor White
Write-Host "   - Update vercel.json with backend URL" -ForegroundColor White

Write-Host ""
Write-Host "4. Post-deployment:" -ForegroundColor Yellow
Write-Host "   - Update backend ALLOWED_ORIGINS with frontend URL" -ForegroundColor White
Write-Host "   - Test all functionality" -ForegroundColor White
"@ | Out-File -FilePath "deployment\quick-deploy.ps1" -Encoding UTF8

# Create deployment summary
@"
# FRAMTT Superadmin Deployment Files

This directory contains all the files and templates needed for deploying your FRAMTT Superadmin application.

## Files Overview

- `backend\deploy-checklist.md` - Step-by-step backend deployment checklist
- `frontend\deploy-checklist.md` - Step-by-step frontend deployment checklist
- `frontend\vercel.json.template` - Vercel configuration template
- `environment-variables.md` - Complete environment variables for both services
- `quick-deploy.ps1` - Quick deployment script with commands (PowerShell)
- `README.md` - This file

## Quick Start

1. Review the checklists in `backend\` and `frontend\` directories
2. Update environment variables in `environment-variables.md`
3. Follow the main `DEPLOYMENT_GUIDE.md` in the project root
4. Use `quick-deploy.ps1` for quick reference commands

## Important Notes

- Generate new JWT secrets for production
- Update all URLs with your actual deployment URLs
- Test thoroughly after deployment
- Monitor logs for any issues
"@ | Out-File -FilePath "deployment\README.md" -Encoding UTF8

Write-Host "✅ Deployment preparation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Created deployment files:" -ForegroundColor Yellow
Write-Host "   - deployment\backend\deploy-checklist.md" -ForegroundColor White
Write-Host "   - deployment\frontend\deploy-checklist.md" -ForegroundColor White
Write-Host "   - deployment\frontend\vercel.json.template" -ForegroundColor White
Write-Host "   - deployment\environment-variables.md" -ForegroundColor White
Write-Host "   - deployment\quick-deploy.ps1" -ForegroundColor White
Write-Host "   - deployment\README.md" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review the main DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   2. Check deployment checklists in deployment\ directory" -ForegroundColor White
Write-Host "   3. Generate new JWT secrets for production" -ForegroundColor White
Write-Host "   4. Deploy backend to Render" -ForegroundColor White
Write-Host "   5. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Happy deploying!" -ForegroundColor Green
