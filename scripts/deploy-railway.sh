#!/bin/bash

# Railway Deployment Script for The Royal Barber Monorepo
# Usage: ./scripts/deploy-railway.sh [api|website|all]

set -e

SERVICE="${1:-all}"

echo "🚀 Deploying The Royal Barber services to Railway..."
echo "Service: $SERVICE"
echo "---"

deploy_api() {
    echo "📡 Deploying API service..."
    cd apps/api
    railway up --service api || railway up
    cd ../..
    echo "✅ API deployment initiated"
}

deploy_website() {
    echo "🌐 Deploying Website service..."
    cd apps/website
    railway up --service website || railway up
    cd ../..
    echo "✅ Website deployment initiated"
}

case $SERVICE in
    "api")
        deploy_api
        ;;
    "website")
        deploy_website
        ;;
    "all")
        deploy_api
        echo "---"
        deploy_website
        ;;
    *)
        echo "❌ Invalid service: $SERVICE"
        echo "Usage: $0 [api|website|all]"
        exit 1
        ;;
esac

echo "---"
echo "🎉 Deployment(s) initiated successfully!"
echo "Check Railway dashboard for deployment status." 