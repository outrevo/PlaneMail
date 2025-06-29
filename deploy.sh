#!/bin/bash

# PlaneMail Deployment Script
# This script helps deploy PlaneMail to Render.com

set -e

echo "🚀 PlaneMail Deployment Script"
echo "=============================="

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check if we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
    echo "⚠️  Warning: You're not on the main branch (currently on: $current_branch)."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

echo "📋 Pre-deployment checks..."

# Check if render.yaml exists
if [[ ! -f "render.yaml" ]]; then
    echo "❌ render.yaml not found!"
    exit 1
fi

# Check if .env.example exists
if [[ ! -f ".env.example" ]]; then
    echo "❌ .env.example not found!"
    exit 1
fi

# Validate package.json exists
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Validate web app package.json exists
if [[ ! -f "apps/web/package.json" ]]; then
    echo "❌ apps/web/package.json not found!"
    exit 1
fi

echo "✅ All required files present"

# Run tests
echo "🧪 Running tests..."
if npm test; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    read -p "Continue deployment anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Type check
echo "🔍 Running type check..."
if npm run typecheck; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed"
    read -p "Continue deployment anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Build test
echo "🏗️  Testing build..."
if npm run build; then
    echo "✅ Build successful"
    # Clean up build artifacts for local development
    npm run clean
else
    echo "❌ Build failed"
    exit 1
fi

# Push to git
echo "📤 Pushing to git..."
git add .
git commit -m "Deploy: $(date +"%Y-%m-%d %H:%M:%S")" || echo "No changes to commit"
git push origin main

echo ""
echo "🎉 Pre-deployment checks complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://render.com/deploy"
echo "2. Connect your GitHub repository"
echo "3. Use the render.yaml file for configuration"
echo "4. Set up environment variables in Render dashboard:"
echo "   - CLERK_SECRET_KEY"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - PADDLE_API_KEY"
echo "   - PADDLE_WEBHOOK_SECRET"
echo "   - NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"
echo "   - NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID"
echo "   - NEXT_PUBLIC_PADDLE_PRO_PRICE_ID"
echo "   - NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID"
echo "   - PADDLE_HOSTED_PRICE_ID"
echo "   - PADDLE_PRO_PRICE_ID"
echo "   - PADDLE_ENTERPRISE_PRICE_ID"
echo ""
echo "📝 Environment variables are automatically configured for:"
echo "   - DATABASE_URL (from PostgreSQL service)"
echo "   - REDIS_URL (from Redis service)"
echo "   - NEXT_PUBLIC_APP_URL (from web service)"
echo "   - NEXT_PUBLIC_APP_DOMAIN (from web service)"
echo ""
echo "🔗 One-click deploy button available in README.md"
echo ""
echo "✨ Deployment ready!"
