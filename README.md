# 🚀 Framtt Admin Dashboard

A comprehensive superadmin dashboard for managing rental companies on the Framtt platform. Built with React 18, TypeScript, Tailwind CSS, and Express.js.

## 📁 Project Structure

```
superadmin-framtt/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React context providers
│   │   ├── lib/             # Utility libraries and types
│   │   ├── styles/          # Global CSS styles
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # App entry point
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── tsconfig.json        # TypeScript config
├── backend/                  # Express.js backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── routes/             # API routes
│   ├── data/               # Mock data and utilities
│   ├── server.js           # Backend entry point
│   └── package.json        # Backend dependencies
├── database/                # Database schemas and migrations
├── deployment/              # Docker and deployment configs
│   ├── docker/             # Docker configurations
│   ├── netlify.toml        # Netlify config
│   ├── vercel.json         # Vercel config
│   └── nginx.conf          # Nginx config
├── docs/                    # Documentation
│   ├── design-specs/       # Design specifications
│   └── guidelines/         # Development guidelines
├── scripts/                 # Utility scripts
├── supabase/               # Supabase configurations
└── package.json            # Root package.json for workspace
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
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

3. **Start development servers**
```bash
npm run dev
```

This will start:
- Frontend development server on `http://localhost:3000`
- Backend development server on `http://localhost:5000`

### Individual Commands

**Frontend only:**
```bash
npm run frontend:dev     # Start frontend dev server
npm run frontend:build   # Build frontend for production
npm run frontend:preview # Preview production build
```

**Backend only:**
```bash
npm run backend:dev      # Start backend with nodemon
npm run backend:start    # Start backend production server
```

## ✨ Features

### 🔗 **URL-Based Navigation**
- Direct URL access to all dashboard sections
- Browser history support with back/forward navigation
- Automatic breadcrumb updates based on current route
- Proper 404 handling for invalid routes
- Document title updates for each section

### 📊 **Dashboard Sections**

**🏠 Overview Dashboard** (`/`)
- Total companies/bookings/revenue metrics with interactive charts
- System health monitoring with real-time status
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
   # Check TypeScript compilation
   npx tsc --noEmit
   ```

4. **Routing issues in production:**
   - Ensure your web server is configured to serve `index.html` for all routes
   - Check the build output and verify all routes work correctly

### Performance Tips

- The dashboard is optimized for desktop-first usage
- All components use React.memo for performance optimization
- Charts are lazy-loaded for faster initial page load
- Mock data is used for development (easily replaceable with real APIs)
- Browser history is efficiently managed by React Router

## 📝 Development Notes

- All components are fully interactive with comprehensive state management
- URL-based navigation enables deep linking and browser history
- Toast notifications use a simple alert system for development (easily replaceable)
- Charts include sample data and are fully responsive
- Integration status tags showcase different connection states
- The design system is consistent across all components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Framtt Team.

---

**🎉 Ready to explore your Framtt Admin Dashboard with full routing support!**

Navigate directly to any section using URLs, bookmark your favorite pages, and enjoy seamless browser navigation throughout your admin experience.