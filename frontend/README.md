# Frontend - Framtt Admin Dashboard

React TypeScript frontend for the Framtt Superadmin Dashboard.

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Routing**: React Router v6
- **State Management**: React Context
- **Icons**: Lucide React
- **Charts**: Recharts

## 📁 Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── figma/           # Components from Figma designs
│   ├── AdminSettings.tsx
│   ├── ClientManagement.tsx
│   ├── LoginPage.tsx
│   ├── OverviewDashboard.tsx
│   └── ...
├── contexts/            # React context providers
│   └── AuthContext.tsx
├── lib/                # Utility libraries and types
│   ├── types.ts
│   └── utils.ts
├── styles/             # Global styles
│   └── globals.css
├── utils/              # Utility functions
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔧 Configuration

- **Vite Config**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`
- **Tailwind**: `tailwind.config.js`
- **PostCSS**: `postcss.config.js`
- **ESLint**: `.eslintrc.cjs`

## 📱 Features

- Responsive design for all screen sizes
- Dark/light theme support
- Type-safe development with TypeScript
- Component-based architecture
- URL-based navigation with React Router
- Accessible UI components with Radix UI
