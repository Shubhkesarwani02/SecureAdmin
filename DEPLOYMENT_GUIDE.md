# 🚀 Complete Deployment Guide - Framtt Superadmin

This guide will walk you through deploying the Framtt Superadmin application with:
- **Frontend**: Vercel (React + Vite + TypeScript)
- **Backend**: Render (Node.js + Express)
- **Database**: Supabase (PostgreSQL)

---

## 📋 Prerequisites

Before starting, ensure you have:
- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Vercel CLI](https://vercel.com/cli) (optional but recommended)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional)
- Accounts on [Vercel](https://vercel.com), [Render](https://render.com), and [Supabase](https://supabase.com)

---

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `framtt-superadmin-db`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Database Credentials

Once your project is created, go to **Settings > Database** and note down:
- **Database URL** (postgresql://...)
- **Host**: `db.[project-ref].supabase.co`
- **Database name**: `postgres`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: (the one you set)

### 1.3 Get API Keys

Go to **Settings > API** and note:
- **Project URL**: `https://[project-ref].supabase.co`
- **Anon public key**: `eyJ...`
- **Service role key**: `eyJ...` (keep this secret!)

### 1.4 Run Database Schema Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd Superadmin_version_18

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_SSL=true

# Supabase Configuration
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# JWT Configuration
JWT_SECRET=[GENERATE-A-SECURE-RANDOM-STRING]
JWT_EXPIRE=1h
IMPERSONATION_TIMEOUT_HOURS=1

# Security
BCRYPT_ROUNDS=12
NODE_ENV=production
```

Run the database setup scripts:

```bash
# Create all tables and schema
node create-missing-tables.js

# Set up role hierarchy
node setup-role-hierarchy-supabase.js

# Create assignment tables
node setup-assignment-tables.js

# Add sample data (optional)
node scripts/create-missing-tables.js
```

---

## 🔧 Step 2: Backend Deployment on Render

### 2.1 Prepare Backend for Deployment

Create a `render.yaml` file in the root directory:

```yaml
services:
  - type: web
    name: framtt-superadmin-backend
    env: node
    plan: starter
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: DB_HOST
        sync: false
      - key: DB_PORT
        value: 5432
      - key: DB_NAME
        value: postgres
      - key: DB_USER
        value: postgres
      - key: DB_PASSWORD
        sync: false
      - key: DB_SSL
        value: true
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRE
        value: 1h
      - key: IMPERSONATION_TIMEOUT_HOURS
        value: 1
      - key: BCRYPT_ROUNDS
        value: 12
      - key: ALLOWED_ORIGINS
        sync: false
```

### 2.2 Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `framtt-superadmin-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Starter` (or higher for production)

### 2.3 Set Environment Variables

In your Render service dashboard, go to **Environment** and add these variables:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_SSL=true
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
JWT_SECRET=[GENERATE-A-SECURE-RANDOM-STRING]
JWT_EXPIRE=1h
IMPERSONATION_TIMEOUT_HOURS=1
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.com
```

### 2.4 Update Backend Configuration

Update `backend/server.js` to handle Render's port:

```javascript
const PORT = process.env.PORT || 5000;
```

Your backend will be available at: `https://framtt-superadmin-backend.onrender.com`

---

## ⚛️ Step 3: Frontend Deployment on Vercel

### 3.1 Prepare Frontend for Deployment

Update `frontend/src/lib/api.ts` to use your backend URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://framtt-superadmin-backend.onrender.com';

export const apiClient = {
  baseURL: API_BASE_URL,
  // ... rest of your API client
};
```

Create `.env.production` in the frontend directory:

```env
VITE_API_BASE_URL=https://framtt-superadmin-backend.onrender.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3.2 Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Select your account
# - Link to existing project: No
# - Project name: framtt-superadmin-frontend
# - Directory: ./
# - Override settings: No
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Set Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

```env
VITE_API_BASE_URL=https://framtt-superadmin-backend.onrender.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3.4 Update Vercel Configuration

The existing `deployment/vercel.json` should work, but you can update it if needed:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://framtt-superadmin-backend.onrender.com"
  }
}
```

Your frontend will be available at: `https://framtt-superadmin-frontend.vercel.app`

---

## 🔒 Step 4: Security & Final Configuration

### 4.1 Update CORS Settings

In your backend's `server.js`, update the allowed origins:

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
    'https://framtt-superadmin-frontend.vercel.app',
    'https://your-custom-domain.com'
  ];
```

### 4.2 Set Up Custom Domain (Optional)

#### For Vercel (Frontend):
1. Go to your Vercel project dashboard
2. Navigate to **Settings > Domains**
3. Add your custom domain
4. Update DNS records as instructed

#### For Render (Backend):
1. Go to your Render service dashboard
2. Navigate to **Settings > Custom Domains**
3. Add your custom domain
4. Update DNS records as instructed

### 4.3 SSL Certificate

Both Vercel and Render provide automatic SSL certificates, so no additional configuration is needed.

---

## 🧪 Step 5: Testing & Verification

### 5.1 Test Backend API

```bash
# Test your backend health endpoint
curl https://framtt-superadmin-backend.onrender.com/api/health

# Test database connection
curl https://framtt-superadmin-backend.onrender.com/api/auth/me
```

### 5.2 Test Frontend

1. Visit your Vercel deployment URL
2. Try logging in with test credentials
3. Test all major features:
   - User authentication
   - Dashboard functionality
   - User management
   - Account health monitoring
   - Impersonation (if applicable)

### 5.3 Monitor Logs

#### Render Backend Logs:
- Go to your Render service dashboard
- Click on "Logs" tab
- Monitor for any errors or issues

#### Vercel Frontend Logs:
- Go to your Vercel project dashboard
- Click on "Functions" tab
- Monitor function logs if using serverless functions

---

## 🔄 Step 6: Continuous Deployment

### 6.1 Automatic Deployments

Both Vercel and Render will automatically deploy when you push to your main branch.

### 6.2 Environment-Specific Deployments

For staging/production environments:

1. **Create separate branches**: `staging`, `production`
2. **Set up environment variables** for each environment
3. **Configure deployment rules** in Vercel/Render

### 6.3 Database Migrations

For future database changes:

```bash
# Create migration scripts
cd backend
node create-migration-script.js

# Run migrations on production
# (You can add this to your deployment pipeline)
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that the backend is properly configured

#### 2. Database Connection Issues
- Verify Supabase credentials
- Check if `DB_SSL=true` is set
- Ensure database is accessible from Render's IP range

#### 3. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check for TypeScript compilation errors

#### 4. Environment Variables
- Ensure all required variables are set in both Vercel and Render
- Check for typos in variable names
- Verify sensitive data is properly encrypted

### Debug Commands

```bash
# Test database connection locally
cd backend
node scripts/check-database.js

# Test API endpoints locally
curl http://localhost:5000/api/health

# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET
```

---

## 📊 Monitoring & Maintenance

### 1. Set Up Monitoring

- **Render**: Built-in monitoring and alerts
- **Vercel**: Built-in analytics and performance monitoring
- **Supabase**: Built-in database monitoring

### 2. Regular Maintenance

- **JWT Secret Rotation**: Run `node tools/jwt-rotate.js` monthly
- **Database Backups**: Supabase provides automatic backups
- **Dependency Updates**: Regularly update npm packages
- **Security Audits**: Run security scans on your codebase

### 3. Performance Optimization

- **Frontend**: Use Vercel's edge caching
- **Backend**: Monitor Render's performance metrics
- **Database**: Optimize queries and indexes

---

## 🎉 Success!

Your Framtt Superadmin application is now deployed and ready for production use!

**Frontend**: `https://framtt-superadmin-frontend.vercel.app`
**Backend**: `https://framtt-superadmin-backend.onrender.com`
**Database**: Supabase (managed)

### Next Steps

1. Set up monitoring and alerting
2. Configure backup strategies
3. Set up CI/CD pipelines
4. Implement logging and analytics
5. Plan for scaling as your user base grows

---

## 📞 Support

If you encounter any issues during deployment:

1. Check the troubleshooting section above
2. Review Render and Vercel documentation
3. Check Supabase status page
4. Review application logs for specific error messages

**Happy Deploying! 🚀**
