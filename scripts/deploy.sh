#!/bin/bash

# Framtt Superadmin Deployment Script
# This script helps automate the deployment process

set -e

echo "🚀 Starting Framtt Superadmin Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Setup backend environment
setup_backend() {
    print_status "Setting up backend environment..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Please create one based on env.example"
        print_status "Copying env.example to .env..."
        cp env.example .env
        print_warning "Please edit .env file with your actual values before continuing"
        read -p "Press Enter after you've updated the .env file..."
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    if node scripts/check-database.js; then
        print_success "Database connection successful!"
    else
        print_error "Database connection failed. Please check your .env configuration."
        exit 1
    fi
    
    cd ..
}

# Setup frontend environment
setup_frontend() {
    print_status "Setting up frontend environment..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Check if .env.production file exists
    if [ ! -f .env.production ]; then
        print_warning ".env.production file not found. Please create one based on env.production.example"
        print_status "Copying env.production.example to .env.production..."
        cp env.production.example .env.production
        print_warning "Please edit .env.production file with your actual values before continuing"
        read -p "Press Enter after you've updated the .env.production file..."
    fi
    
    # Test build
    print_status "Testing frontend build..."
    if npm run build; then
        print_success "Frontend build successful!"
    else
        print_error "Frontend build failed. Please check for errors."
        exit 1
    fi
    
    cd ..
}

# Deploy to Render (Backend)
deploy_backend() {
    print_status "Deploying backend to Render..."
    
    if command -v render &> /dev/null; then
        print_status "Using Render CLI..."
        render deploy
    else
        print_warning "Render CLI not found. Please deploy manually:"
        echo "1. Go to https://dashboard.render.com/"
        echo "2. Create a new Web Service"
        echo "3. Connect your GitHub repository"
        echo "4. Use the configuration from render.yaml"
        echo "5. Set environment variables as specified in the deployment guide"
    fi
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if command -v vercel &> /dev/null; then
        print_status "Using Vercel CLI..."
        cd frontend
        vercel --prod
        cd ..
    else
        print_warning "Vercel CLI not found. Please deploy manually:"
        echo "1. Go to https://vercel.com/dashboard"
        echo "2. Create a new project"
        echo "3. Import your GitHub repository"
        echo "4. Set root directory to 'frontend'"
        echo "5. Set environment variables as specified in the deployment guide"
    fi
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "  Framtt Superadmin Deployment Script"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environments
    setup_backend
    setup_frontend
    
    echo ""
    echo "=========================================="
    echo "  Environment Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Deploy backend to Render"
    echo "2. Deploy frontend to Vercel"
    echo "3. Configure environment variables"
    echo "4. Test the deployment"
    echo ""
    
    read -p "Do you want to proceed with deployment? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_backend
        deploy_frontend
        
        echo ""
        print_success "Deployment process completed!"
        echo ""
        echo "Please complete the following manual steps:"
        echo "1. Set environment variables in Render dashboard"
        echo "2. Set environment variables in Vercel dashboard"
        echo "3. Test your application"
        echo "4. Configure custom domains (optional)"
    else
        print_status "Deployment skipped. You can run the deployment manually later."
    fi
}

# Run main function
main "$@"
