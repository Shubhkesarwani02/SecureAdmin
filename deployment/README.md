# 🚀 Deployment Configuration

This directory contains deployment configurations for various platforms and environments for the Framtt Superadmin Dashboard.

## 📁 Deployment Options

### ☁️ Platform Deployments

#### Vercel (Recommended for Frontend)
- **`vercel.json`** - Vercel deployment configuration
- Optimized for React/TypeScript frontend
- Automatic HTTPS and CDN
- Preview deployments for pull requests

#### Netlify (Alternative Frontend)
- **`netlify.toml`** - Netlify deployment configuration  
- Static site hosting with build optimization
- Form handling and serverless functions
- Branch-based deployments

#### Docker Containerization
- **`docker/`** - Docker configurations for containers
- **`Dockerfile/`** - Multi-stage Docker builds
- Production-ready container images
- Orchestration with Docker Compose

#### Traditional Server
- **`nginx.conf`** - Nginx reverse proxy configuration
- Load balancing and SSL termination
- Static file serving optimization
- Security headers and rate limiting

## 🚀 Quick Deployment

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Frontend Deployment (Netlify)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from frontend directory
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Backend Deployment (Docker)
```bash
# Build Docker image
docker build -t framtt-backend -f deployment/docker/Dockerfile.backend .

# Run container
docker run -p 3001:3001 --env-file backend/.env framtt-backend
```

### Full Stack Deployment (Docker Compose)
```bash
# Start all services
docker-compose -f deployment/docker/docker-compose.yml up -d

# Check status
docker-compose -f deployment/docker/docker-compose.yml ps
```

## 🔧 Configuration Details

### Vercel Configuration (`vercel.json`)
```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  base = "frontend/"
  publish = "dist/"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Nginx Configuration (`nginx.conf`)
- Reverse proxy for backend API
- Static file serving for frontend
- SSL/TLS configuration
- Security headers and rate limiting
- Gzip compression and caching

## 🏗️ Deployment Environments

### Development
```bash
# Local development
npm run dev

# Docker development
docker-compose -f deployment/docker/docker-compose.dev.yml up
```

### Staging
```bash
# Staging deployment
vercel --target staging

# Or with custom domain
vercel --target staging --name framtt-staging
```

### Production
```bash
# Production deployment
vercel --prod

# With custom domain
vercel --prod --name framtt-superadmin
```

## 🔒 Environment Variables

### Frontend Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=https://api.framtt.com
VITE_APP_TITLE=Framtt Superadmin
VITE_ENVIRONMENT=production
```

### Backend Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://admin.framtt.com
```

### Database Environment Variables
```bash
# Database
POSTGRES_DB=framtt_superadmin
POSTGRES_USER=framtt_user
POSTGRES_PASSWORD=secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```bash
# Backend health check
curl https://api.framtt.com/api/health

# Detailed health check
curl https://api.framtt.com/api/health/detailed
```

### Monitoring Setup
```bash
# Application logs
tail -f /var/log/framtt/app.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Docker logs
docker logs framtt-backend
docker logs framtt-frontend
```

## 🚨 Deployment Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear build cache
rm -rf node_modules package-lock.json
npm install

# Rebuild with verbose logging
npm run build --verbose
```

#### Environment Variable Issues
```bash
# Verify environment variables
printenv | grep VITE_
printenv | grep NODE_ENV

# Test configuration
node -e "console.log(process.env)"
```

#### SSL/HTTPS Issues
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443

# Verify certificate expiration
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### Database Connection Issues
```bash
# Test database connection
psql -h your-db-host -U your-db-user -d your-db-name -c "SELECT version();"

# Check database status
docker logs your-postgres-container
```

### Rollback Procedures
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Netlify rollback
netlify sites:list
netlify api rollbackSiteDeploy --site-id=YOUR_SITE_ID

# Docker rollback
docker tag framtt-backend:latest framtt-backend:backup
docker pull framtt-backend:previous
docker stop framtt-backend && docker run framtt-backend:previous
```

## 🔗 Related Documentation

- **Backend Setup**: [../backend/README.md](../backend/README.md)
- **Frontend Setup**: [../frontend/README.md](../frontend/README.md)
- **Database Setup**: [../database/README.md](../database/README.md)
- **Scripts**: [../scripts/README.md](../scripts/README.md)

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build process tested locally
- [ ] SSL certificates valid
- [ ] DNS configuration correct

### Post-Deployment
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Monitoring alerts configured

---

*Last Updated: August 12, 2025*

**Supported Platforms**: Vercel, Netlify, Docker, Traditional Servers  
**Recommended Stack**: Vercel (Frontend) + Railway/Render (Backend) + Supabase (Database)
