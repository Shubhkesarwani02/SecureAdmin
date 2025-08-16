# 🔧 Development Tools

This directory contains development and debugging tools for the Superadmin project.

## 📁 Directory Structure

```
tools/
└── debug/                      # Debugging utilities
    └── debug_auth.js          # Authentication debugging script
```

## 🛠️ Available Tools

### Debug Tools (`debug/`)

#### `debug_auth.js`
Authentication debugging utility for troubleshooting login and token issues.

**Purpose:**
- Test authentication flows
- Debug JWT token validation
- Verify user authentication states
- Troubleshoot login issues

**Usage:**
```bash
node tools/debug/debug_auth.js
```

## 📋 Tool Categories

### Debugging Tools
- **Authentication Debugging** - Tools for debugging auth flows
- **Database Debugging** - Tools for database connection and query debugging
- **API Debugging** - Tools for testing and debugging API endpoints

### Development Utilities
- **Code Generation** - Scripts for generating boilerplate code
- **Testing Helpers** - Utilities for testing and test data generation
- **Build Tools** - Custom build and deployment utilities

## 🚀 Adding New Tools

When adding new tools to this directory:

1. **Create appropriate subdirectories** based on tool category
2. **Add documentation** explaining the tool's purpose and usage
3. **Update this README** with the new tool information
4. **Include usage examples** for complex tools

### Tool Naming Convention
- Use descriptive names that indicate the tool's purpose
- Use kebab-case for file names (e.g., `debug-auth.js`)
- Include file extension appropriate for the tool type

### Documentation Requirements
Each tool should include:
- Header comments explaining the purpose
- Usage instructions
- Example commands
- Required dependencies or setup

## 🔗 Related Directories

- **`scripts/`** - Project-wide development and build scripts
- **`backend/tools/`** - Backend-specific development tools
- **`database/`** - Database-related tools and scripts
