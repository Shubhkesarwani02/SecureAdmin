# 🚀 Framtt Superadmin Dashboard

A comprehensive superadmin dashboard for managing rental companies on the Framtt platform. Built with React 18, TypeScript, Tailwind CSS, and Express.js with enterprise-grade security and role-based access control.

## 📁 Organized Project Structure

```
superadmin-framtt/
├── 📁 frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── contexts/               # React context providers
│   │   ├── lib/                    # Utility libraries and types
│   │   ├── styles/                 # Global CSS styles
│   │   ├── utils/                  # Utility functions
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # App entry point
│   ├── public/                     # Static assets
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   └── README.md                   # Frontend documentation
├── 📁 backend/                     # Express.js backend API
│   ├── controllers/                # Route controllers and business logic
│   ├── middleware/                 # Express middleware (auth, security)
│   ├── routes/                     # API route definitions
│   ├── services/                   # Business logic and database services
│   ├── utils/                      # Utility functions and helpers
│   ├── tools/                      # 🔧 Development and maintenance tools
│   │   ├── generate-password.js    # Secure password generation
│   │   ├── jwt-rotate.js           # JWT token rotation
│   │   ├── security-audit.js       # Security vulnerability scanning
│   │   ├── verify-auth.js          # Authentication testing
│   │   └── verify-security.js      # Security configuration verification
│   ├── docs/                       # 📚 Backend-specific documentation
│   ├── data/                       # Mock data and test fixtures
│   ├── tests/                      # Test suites and utilities
│   ├── scripts/                    # Database and deployment scripts
│   ├── logs/                       # Application logs
│   ├── server.js                   # Main server entry point
│   └── README.md                   # Backend documentation
├── 📁 database/                    # Database schemas and migrations
│   ├── 01_create_users_table.sql   # User accounts and authentication
│   ├── 02_create_clients_table.sql # Rental company clients
│   ├── 03_create_vehicles_table.sql # Vehicle fleet management
│   ├── ...                         # Additional migration scripts
│   ├── final_schema_specification.sql # Complete schema overview
│   └── README.md                   # Database documentation
├── 📁 deployment/                  # Deployment configurations
│   ├── docker/                     # Docker configurations
│   ├── netlify.toml                # Netlify config
│   ├── vercel.json                 # Vercel config
│   ├── nginx.conf                  # Nginx config
│   └── README.md                   # Deployment documentation
├── 📁 docs/                        # 📚 Comprehensive documentation
│   ├── implementation/             # Implementation details and verification
│   ├── api/                        # API documentation and endpoints
│   ├── status-reports/             # Project status and progress
│   ├── design-specs/               # Design specifications
│   ├── guidelines/                 # Development guidelines
│   └── README.md                   # Documentation index
├── 📁 scripts/                     # Utility scripts
│   ├── dev-windows.bat             # Windows development setup
│   ├── start.sh                    # Unix/Linux startup script
│   ├── test-authorization.js       # Authorization testing
│   ├── verify-endpoints.js         # API endpoint verification
│   └── README.md                   # Scripts documentation
├── 📁 supabase/                    # Supabase configurations
├── 📄 PROJECT_STRUCTURE.md         # Detailed project structure
└── 📄 package.json                 # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL or Supabase database
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd superadmin-framtt
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your configuration
```

4. **Set up database**
```bash
# Run database migrations
cd database
psql -d your_database -f database-setup.sql
```

5. **Start development servers**
```bash
# Option 1: Use project scripts (Windows)
scripts\dev-windows.bat

# Option 2: Use project scripts (Unix/Linux/macOS)
chmod +x scripts/start.sh
./scripts/start.sh

# Option 3: Use npm scripts
npm run dev
```

This will start:
- Frontend development server on `http://localhost:5173`
- Backend development server on `http://localhost:3001`

### Individual Commands

**Frontend Development:**
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

**Backend Development:**
```bash
cd backend
npm run dev          # Start with nodemon
npm run start        # Start production server
npm run test         # Run test suite
npm run security     # Run security audit
```

## ✨ Key Features

### 🔐 **Enterprise Security**
- **JWT Authentication** with role-based access control (RBAC)
- **Multi-tier Role System**: SuperAdmin → Admin → CSM → User
- **Impersonation System** for admin user management
- **Rate Limiting** and DDoS protection
- **Security Middleware** with input validation
- **Audit Logging** for all user actions

### 🏢 **Client & User Management**
- **Client (Rental Company) Management**
- **User Administration** with detailed permissions
- **Account Assignment** logic for CSMs and clients
- **Vehicle Fleet Management** with real-time tracking

### 📊 **Analytics & Monitoring**
- **Dashboard KPIs** with real-time metrics
- **System Health Monitoring**
- **Performance Analytics**
- **Notification System** for alerts

### 🔗 **URL-Based Navigation**
- Direct URL access to all dashboard sections
- Browser history support with back/forward navigation
- Automatic breadcrumb updates based on current route
- Proper 404 handling for invalid routes
- Document title updates for each section
- Quick action buttons for common tasks
- Revenue trend analysis and growth metrics

**👥 Client Management** (`/clients`)
- Complete tenant listings with advanced search and filtering
- Integration status tags (AI Recommendation, WhatsApp, Tracking, Marketing)
- Client actions (view, disable, impersonate, edit)
- KYC status management with approval workflows

**🔧 System Monitoring** (`/monitoring`)
- Real-time system health metrics (CPU, Memory, Disk, Network)
- API uptime and response time tracking
- Database performance monitoring
- Error tracking and detailed logging system

**💳 Payments & Billing** (`/payments`)
- Revenue analytics and subscription management
- Payment processing and failure handling
- Invoice generation and transaction tracking
- Subscription renewal management

**🔗 Snippet Manager** (`/snippets`)
- Generate unique 5-digit integration codes
- Multi-platform code snippets (Web, Mobile, API)
- Integration status tracking and feature management
- Complete documentation and setup guides

**⚙️ Admin Settings** (`/settings`)
- User role and permission management
- Security configuration (2FA, session timeout, API limits)
- System notifications and alert settings
- Comprehensive audit logs and activity tracking

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM v6 with browser history
- **Styling**: Tailwind CSS v3 with custom design system
- **UI Components**: Custom component library built on Radix UI
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Build Tool**: Vite for fast development and building

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm** (Download from [nodejs.org](https://nodejs.org/))
- **Git** (for cloning the repository)

### Option 1: Automated Setup (Recommended)

**For macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**For Windows:**
```cmd
start.bat
```

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## 🔗 Navigation Routes

The dashboard now supports direct URL access to all sections:

- **Overview Dashboard**: `http://localhost:3000/`
- **Client Management**: `http://localhost:3000/clients`
- **System Monitoring**: `http://localhost:3000/monitoring`
- **Payments & Billing**: `http://localhost:3000/payments`
- **Snippet Manager**: `http://localhost:3000/snippets`
- **Admin Settings**: `http://localhost:3000/settings`

### Browser Features

- ✅ **Back/Forward Navigation**: Use browser buttons to navigate
- ✅ **Bookmarkable URLs**: Save and share direct links to sections
- ✅ **Refresh Support**: Reload any page without losing context
- ✅ **Dynamic Page Titles**: Browser tab shows current section
- ✅ **404 Error Handling**: Friendly error page for invalid routes

## 📁 Project Structure

```
├── components/          # React components
│   ├── ui/             # Reusable UI components (Radix-based)
│   ├── OverviewDashboard.tsx
│   ├── ClientManagement.tsx
│   ├── SystemMonitoring.tsx
│   ├── PaymentsBilling.tsx
│   ├── SnippetManager.tsx
│   ├── AdminSettings.tsx
│   ├── NotFound.tsx    # 404 error page
│   └── BreadcrumbNavigation.tsx
├── lib/                # Utility functions and types
├── styles/             # Global styles and Tailwind config
├── App.tsx            # Main application with routing
├── main.tsx           # Application entry point
└── package.json       # Dependencies and scripts
```

## 🎨 Design System

The dashboard follows a consistent design system with:

- **14px base font size** for optimal readability
- **Custom color palette** with light/dark theme support
- **Consistent spacing** using Tailwind CSS utilities
- **Typography hierarchy** with semantic heading styles
- **Component variants** for different use cases

## 🔧 Features in Detail

### Interactive Components
- ✅ Fully functional sidebar navigation with active states
- ✅ Modal dialogs with form handling and validation
- ✅ Data tables with sorting, filtering, and pagination
- ✅ Charts and graphs with responsive design
- ✅ Toast notifications for user feedback
- ✅ Search and filter functionality across all sections

### Routing & Navigation
- ✅ Browser history integration
- ✅ URL-based state management
- ✅ Dynamic breadcrumb navigation
- ✅ Automatic active state detection
- ✅ Clickable logo for quick home navigation

### Data Management
- ✅ Mock data for all dashboard sections
- ✅ State management for forms and user interactions
- ✅ Real-time updates and status tracking
- ✅ Export functionality for reports and data

### Security & Access Control
- ✅ Role-based permission system
- ✅ User authentication flow simulation
- ✅ Security settings configuration
- ✅ Audit logging for all user actions

## 🌐 Deployment Options

### Development
The project is optimized for local development with hot reloading and fast refresh.

### Production
Build the project for production deployment:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to:
- **Vercel** (includes `vercel.json`)
- **Netlify** (includes `netlify.toml`)
- **Docker** (includes `Dockerfile`)
- Any static hosting service

**Note**: The application uses client-side routing, so make sure your hosting provider is configured to serve `index.html` for all routes.

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   # Or use different port
   npm run dev -- --port 3001
   ```

2. **Node modules issues:**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors:**
   ```bash
## 📚 Documentation & Resources

### 🎯 Quick Navigation

#### For Developers
- **[Backend API Documentation](backend/README.md)** - Complete backend setup and API reference
- **[Frontend Documentation](frontend/README.md)** - React setup and component documentation
- **[Database Schema](database/README.md)** - Database structure and migration guides
- **[Development Tools](backend/tools/README.md)** - Security tools and utilities

#### For Project Managers
- **[Project Status](docs/status-reports/)** - Current implementation status
- **[Implementation Summary](docs/implementation/)** - Feature implementation details
- **[API Endpoints](docs/api/)** - Complete API documentation

#### For DevOps & Deployment
- **[Deployment Guide](deployment/README.md)** - Platform-specific deployment instructions
- **[Scripts Documentation](scripts/README.md)** - Development and utility scripts
- **[Environment Setup](docs/guidelines/)** - Development environment guidelines

#### For Security Audits
- **[Security Implementation](docs/implementation/SECURITY_IMPLEMENTATION_COMPLETE.md)** - Security measures
- **[Authentication System](docs/AUTHENTICATION_IMPLEMENTATION.md)** - Auth implementation details
- **[Authorization Logic](docs/AUTHORIZATION_LOGIC_EXAMPLES.md)** - RBAC examples

### 🗂️ Documentation Structure
```
docs/
├── 📁 implementation/          # Implementation details and verification
├── 📁 api/                     # API documentation and endpoints  
├── 📁 status-reports/          # Project status and progress
├── 📁 design-specs/            # UI/UX design specifications
├── 📁 guidelines/              # Development standards
└── 📄 README.md               # Documentation index
```

## 🔧 Development Workflow

### Getting Started
1. **Setup Environment**: Follow [installation guide](#installation) above
2. **Review Documentation**: Start with [docs/README.md](docs/README.md)
3. **Check Project Status**: Review [status reports](docs/status-reports/)
4. **Run Security Checks**: Use [backend tools](backend/tools/README.md)

### Development Commands
```bash
# Start development environment
npm run dev                    # Start both frontend and backend

# Development tools
npm run test                   # Run all tests
npm run security              # Run security audit
npm run lint                  # Run code linting

# Build for production
npm run build                 # Build both frontend and backend
npm run deploy                # Deploy to production
```

### Testing & Validation
```bash
# Test API endpoints
node scripts/verify-endpoints.js

# Test authorization system  
node scripts/test-authorization.js

# Security verification
node backend/tools/verify-security.js

# Authentication testing
node backend/tools/verify-auth.js
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
psql -d your_database -c "SELECT version();"

# Run database migrations
cd database && psql -d your_database -f database-setup.sql
```

#### Authentication Issues
```bash
# Verify JWT configuration
node backend/tools/verify-auth.js

# Generate new password
node backend/tools/generate-password.js
```

#### Build/Deployment Issues
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install && npm run build

# Check deployment configuration
cat deployment/vercel.json
cat deployment/netlify.toml
```

### Getting Help
1. **Check Documentation**: Start with [docs/README.md](docs/README.md)
2. **Review Status Reports**: Check [implementation status](docs/status-reports/)
3. **Run Diagnostic Tools**: Use [backend tools](backend/tools/README.md)
4. **Check Logs**: Review application logs in `backend/logs/`

## 🤝 Contributing

### Development Standards
1. **Follow Documentation**: Reference [development guidelines](docs/guidelines/)
2. **Test Security**: Run [security tools](backend/tools/README.md) before commits
3. **Update Documentation**: Keep documentation current with changes
4. **Follow Git Workflow**: Use feature branches and detailed commit messages

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and security checks (`npm run test && npm run security`)
4. Update relevant documentation
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request with detailed description

## 📄 License

This project is proprietary software developed for Framtt Team.

---

## 🎉 Welcome to Framtt Superadmin Dashboard!

**Your comprehensive administrative platform with:**
- 🔐 **Enterprise-grade security** with role-based access control
- 📊 **Real-time analytics** and monitoring dashboards  
- 🏢 **Complete client management** for rental companies
- 🚗 **Vehicle fleet management** with booking tracking
- 👥 **Advanced user administration** with impersonation
- 🔧 **Developer-friendly tools** and comprehensive documentation

**Ready to start?** Follow the [Quick Start](#quick-start) guide above or explore the [documentation](docs/README.md) for detailed information.

*Navigate directly to any section using URLs, bookmark your favorite pages, and enjoy seamless browser navigation throughout your admin experience.*