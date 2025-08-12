#!/bin/bash

# Framtt Superadmin Backend Setup Script
# This script helps set up the backend with proper environment and database

echo "🚀 Setting up Framtt Superadmin Backend..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📋 Creating .env file..."
    cp .env.template .env
    echo "✅ .env file created from template"
    echo "⚠️  Please edit .env file with your actual configuration before starting the server"
else
    echo "✅ .env file already exists"
fi

# Check if database exists
echo ""
echo "🗄️  Checking database setup..."

# Read database config from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')

if [ -z "$DB_NAME" ]; then
    DB_NAME="framtt_superadmin"
    echo "⚠️  Using default database name: $DB_NAME"
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📋 Creating database '$DB_NAME'..."
    createdb $DB_NAME
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' created successfully"
    else
        echo "❌ Failed to create database '$DB_NAME'"
        echo "Please create it manually: createdb $DB_NAME"
    fi
fi

# Run database migrations
echo ""
echo "📋 Setting up database schema..."

if [ -f "../database/10_enhanced_schema_for_impersonation.sql" ]; then
    psql -d $DB_NAME -f "../database/10_enhanced_schema_for_impersonation.sql"
    if [ $? -eq 0 ]; then
        echo "✅ Database schema setup completed"
    else
        echo "❌ Failed to setup database schema"
        echo "Please run manually: psql -d $DB_NAME -f ../database/10_enhanced_schema_for_impersonation.sql"
    fi
else
    echo "⚠️  Database schema file not found. Please run the SQL files manually."
fi

# Create uploads directory
echo ""
echo "📁 Creating upload directories..."
mkdir -p uploads
mkdir -p logs
echo "✅ Upload and log directories created"

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual database connection and secrets"
echo "2. Start the development server: npm run dev"
echo "3. Test the API: http://localhost:5000/health"
echo ""
echo "Default credentials (after schema setup):"
echo "  Superadmin: superadmin@framtt.com / password"
echo "  Admin: admin@framtt.com / password"
echo ""
echo "Important: Change default passwords in production!"
echo ""
echo "Available commands:"
echo "  npm start      - Start production server"
echo "  npm run dev    - Start development server with auto-reload"
echo "  npm test       - Run tests"
echo ""
echo "Documentation: see README_ENHANCED.md for detailed information"
