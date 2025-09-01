# 🚀 FRAMTT Superadmin Complete Deployment Guide

## Overview
This guide covers deploying the FRAMTT Superadmin system with:
- **Backend**: Node.js/Express API on Render
- **Frontend**: React/TypeScript application on Vercel
- **Database**: Supabase (already configured)

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] GitHub repository with your code
- [x] Supabase project with database configured
- [x] Render account (free tier available)
- [x] Vercel account (free tier available)
- [x] Your environment variables documented

---

## 🌐 Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Production

1. **Create Production Environment File**
   ```bash
   # Create backend/.env.production (copy from backend/.env and update)
   ```

2. **Update package.json scripts** (if needed)
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js",
       "test": "jest",
       "db:setup": "node create_missing_tables.js",
       "db:seed": "node insert_sample_health_data.js"
     }
   }
   ```

### Step 2: Deploy Backend to Render

1. **Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository: `framtt-superadmin`

3. **Configure Service Settings**
   ```
   Name: framtt-superadmin-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main (or your production branch)
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Configure Environment Variables**
   In Render dashboard, go to Environment tab and add:

   ```env
   # Database Configuration - Supabase
   DB_HOST=db.wqpkqjxsuqburhksoafb.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=Shubh@2025#123
   DB_SSL=true

   # Alternative connection string
   DATABASE_URL=postgresql://postgres:Shubh%402025%23123@db.wqpkqjxsuqburhksoafb.supabase.co:5432/postgres

   # Supabase Configuration
   SUPABASE_URL=https://wqpkqjxsuqburhksoafb.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw

   # JWT Configuration
   JWT_SECRET=19b79b00fdcb4accf9c0581f9e265f64f640e88b8e06af83a4c9e8f2b1d7e3a2f5c8e9b1a3d6f2e8c5b9a7e4f1d8e2b5a9c6f3e0d7b4a1e8f5c2b9d6a3
   JWT_PREVIOUS_SECRET=58a0ce23c5701c316c8522a4411a0bd67f43d2ef5028d2523c79c5a7036e8f2b9a5d1c4e7f0b3a6d9c2e5f8b1a4d7e0c3f6b9a2e5d8c1f4b7a0e3d6
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRE=1h
   JWT_SECRET_ROTATION_DAYS=30
   JWT_SECRET_LAST_ROTATION=2025-08-12T00:00:00.000Z

   # Server Configuration
   NODE_ENV=production
   PORT=10000

   # Security Configuration
   BCRYPT_ROUNDS=12

   # CORS Configuration (UPDATE WITH YOUR VERCEL DOMAIN)
   ALLOWED_ORIGINS=https://your-app-name.vercel.app,https://framtt-superadmin.vercel.app

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

5. **Deploy the Service**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL: `https://your-service-name.onrender.com`

### Step 3: Verify Backend Deployment

1. **Test API Endpoints**
   ```bash
   # Health check
   curl https://your-backend-url.onrender.com/api/health

   # API status
   curl https://your-backend-url.onrender.com/api/status
   ```

2. **Check Logs**
   - Go to Render dashboard → Your service → Logs
   - Verify no critical errors

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Production

1. **Update Frontend Environment Variables**
   Create `frontend/.env.production`:
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

2. **Update vercel.json Configuration**
   ```json
   {
     "buildCommand": "npm run build:legacy",
     "outputDirectory": "dist",
     "installCommand": "npm install --legacy-peer-deps",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-url.onrender.com/api/:path*"
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
     ]
   }
   ```

### Step 2: Deploy Frontend to Vercel

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select your repository: `framtt-superadmin`

3. **Configure Project Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build:legacy
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

4. **Configure Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables:

   ```env
   # Add all variables from your frontend/.env.production
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_SUPABASE_PROJECT_ID=wqpkqjxsuqburhksoafb
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw
   VITE_DEMO_MODE=false
   ```

5. **Deploy the Project**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL: `https://your-app-name.vercel.app`

### Step 3: Update Backend CORS Settings

1. **Update Backend Environment Variables**
   - Go back to Render dashboard
   - Update `ALLOWED_ORIGINS` environment variable:
   ```env
   ALLOWED_ORIGINS=https://your-app-name.vercel.app,https://framtt-superadmin.vercel.app
   ```

2. **Redeploy Backend**
   - Trigger a new deployment to apply CORS changes

---

## 🔗 Part 3: Final Configuration & Testing

### Step 1: Update vercel.json with Actual Backend URL

1. **Update vercel.json**
   ```json
   {
     "buildCommand": "npm run build:legacy",
     "outputDirectory": "dist",
     "installCommand": "npm install --legacy-peer-deps",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://framtt-superadmin-backend.onrender.com/api/:path*"
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
     ]
   }
   ```

2. **Redeploy Frontend**
   - Commit changes to Git
   - Vercel will auto-deploy

### Step 2: Database Setup (if not done)

1. **Run Database Migrations**
   ```bash
   # Connect to your backend service terminal (Render)
   # Or run locally and connect to production database
   npm run db:setup
   npm run db:seed
   ```

### Step 3: Comprehensive Testing

1. **Test Backend API**
   ```bash
   # Health check
   curl https://your-backend-url.onrender.com/api/health

   # Authentication
   curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@framtt.com","password":"SecurePassword123!"}'
   ```

2. **Test Frontend Application**
   - Visit: `https://your-app-name.vercel.app`
   - Test login with admin credentials
   - Verify all features work

3. **Test API Integration**
   - Login to frontend
   - Navigate through dashboard
   - Verify data loads correctly
   - Test CRUD operations

---

## 🔧 Part 4: Production Optimizations

### Security Hardening

1. **Update JWT Secrets**
   ```bash
   # Generate new production secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Enable Security Headers**
   - Verify Helmet.js is configured
   - Check CSP headers in browser

3. **Rate Limiting**
   - Monitor rate limiting logs
   - Adjust limits based on usage

### Performance Optimization

1. **Frontend Optimizations**
   ```json
   // In package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' tsc -b && vite build --mode production"
     }
   }
   ```

2. **Backend Optimizations**
   - Enable compression middleware
   - Optimize database queries
   - Add caching where appropriate

### Monitoring Setup

1. **Backend Monitoring**
   - Set up Render metrics
   - Configure log aggregation
   - Set up alerts

2. **Frontend Monitoring**
   - Use Vercel Analytics
   - Set up error tracking
   - Monitor performance metrics

---

## 📝 Part 5: Deployment Checklist

### Pre-Deployment
- [ ] All environment variables documented
- [ ] Database migrations ready
- [ ] Security configurations verified
- [ ] Testing completed locally

### Backend Deployment (Render)
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Build and start commands set
- [ ] Service deployed successfully
- [ ] Health check endpoint working
- [ ] Database connection verified

### Frontend Deployment (Vercel)
- [ ] GitHub repository connected
- [ ] Build configuration set
- [ ] Environment variables configured
- [ ] API URL updated
- [ ] vercel.json configured
- [ ] Application deployed successfully

### Post-Deployment
- [ ] CORS settings updated
- [ ] End-to-end testing completed
- [ ] Admin login working
- [ ] All features functional
- [ ] Performance monitoring enabled
- [ ] Security headers verified

---

## 🆘 Troubleshooting

### Common Backend Issues

1. **Database Connection Errors**
   ```bash
   # Check environment variables
   # Verify Supabase configuration
   # Test connection string format
   ```

2. **CORS Errors**
   ```bash
   # Update ALLOWED_ORIGINS
   # Redeploy backend service
   # Clear browser cache
   ```

3. **Build Failures**
   ```bash
   # Check Node.js version compatibility
   # Verify package.json scripts
   # Review build logs
   ```

### Common Frontend Issues

1. **Build Errors**
   ```bash
   # Use legacy build command
   npm run build:legacy
   
   # Check TypeScript errors
   npm run lint
   ```

2. **API Connection Issues**
   ```bash
   # Verify VITE_API_URL
   # Check network tab in browser
   # Verify backend is running
   ```

3. **Environment Variable Issues**
   ```bash
   # Ensure variables start with VITE_
   # Redeploy after changes
   # Check browser console
   ```

### Performance Issues

1. **Slow Backend Response**
   - Check Render service logs
   - Monitor database performance
   - Optimize queries

2. **Large Bundle Size**
   - Analyze bundle with Vite
   - Implement code splitting
   - Optimize imports

---

## 📞 Support & Resources

### Documentation
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Community
- [Render Community](https://community.render.com/)
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com/)

### Your Application URLs
```
Frontend: https://your-app-name.vercel.app
Backend:  https://your-backend-url.onrender.com
Database: Supabase (configured)
```

---

## 🎉 Congratulations!

Your FRAMTT Superadmin system is now deployed and ready for production use!

Remember to:
- Monitor your applications regularly
- Keep dependencies updated
- Review security settings periodically
- Back up your database regularly
- Monitor usage and scale as needed

Happy managing! 🚀
