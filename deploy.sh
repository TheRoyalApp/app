#!/bin/bash

# The Royal Barber Railway Deployment Script

echo "🚀 Starting Railway deployment for The Royal Barber..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if we're linked to a project
if ! railway status &> /dev/null; then
    echo "❌ Not linked to a Railway project. Please run:"
    echo "railway link"
    exit 1
fi

echo "📦 Installing dependencies..."
npm run install:all

echo "🧪 Running tests..."
npm test

echo "🔨 Building services..."
npm run build

echo "🚀 Deploying API service to Railway..."
cd apps/api
railway up

echo "🌐 Deploying Website service to Railway..."
cd ../website
railway up

echo "✅ Deployment completed!"
echo "🌐 Check your Railway dashboard for deployment status"
echo "📊 API Health: https://your-api-service.railway.app/health"
echo "🌐 Website: https://your-website-service.railway.app/" 