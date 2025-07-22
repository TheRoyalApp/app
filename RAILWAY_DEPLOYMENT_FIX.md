# Railway Deployment Fix for The Royal Barber Monorepo

## 🚨 Issues Identified

Your monorepo deployment to Railway was failing due to several configuration issues:

1. **Conflicting Railway Configurations**: Multiple `railway.json` files causing confusion
2. **Incorrect Monorepo Structure**: Railway couldn't properly identify services
3. **Missing Service Separation**: No clear distinction between API and Website services

## ✅ Fixes Applied

### 1. Root Railway Configuration
- Created proper `railway.json` at root level
- Configured for monorepo deployment
- Set default health check and restart policies

### 2. Updated Package.json Scripts
- Added proper deployment scripts
- Fixed monorepo workspace configuration
- Added service-specific deployment commands

### 3. Improved Deployment Script
- Updated `deploy.sh` to handle service separation
- Added proper directory navigation
- Enhanced error handling and feedback

## 🚀 How to Deploy

### Option 1: Use the Fixed Deployment Script
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### Option 2: Manual Service Deployment
```bash
# Deploy API service
npm run deploy:api

# Deploy Website service  
npm run deploy:website

# Deploy both services
npm run deploy:all
```

### Option 3: Individual Service Deployment
```bash
# Deploy API only
cd apps/api
railway up

# Deploy Website only
cd apps/website
railway up
```

## 🔧 Environment Variables Setup

### API Service Variables
```bash
railway variables set DATABASE_URL="your-postgresql-url"
railway variables set JWT_SECRET="your-secret-key"
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set TWILIO_ACCOUNT_SID="AC..."
railway variables set TWILIO_AUTH_TOKEN="..."
railway variables set TWILIO_PHONE_NUMBER="+1..."
railway variables set NODE_ENV="production"
```

### Website Service Variables
```bash
railway variables set REACT_APP_API_URL="https://your-api-service.railway.app"
```

## 📁 Updated Project Structure

```
the_royal_barber/
├── railway.json              # Root Railway config
├── package.json              # Root package.json with deployment scripts
├── deploy.sh                 # Updated deployment script
├── .railwayignore           # Root ignore patterns
├── apps/
│   ├── api/
│   │   ├── railway.json     # API-specific Railway config
│   │   ├── package.json     # API dependencies
│   │   └── src/            # API source code
│   ├── website/
│   │   ├── railway.json    # Website-specific Railway config
│   │   ├── package.json    # Website dependencies
│   │   └── index.html      # Static site
│   └── app/                # React Native app (not deployed)
└── RAILWAY_DEPLOYMENT_FIX.md # This guide
```

## 🧪 Testing Before Deployment

```bash
# Install all dependencies
npm run install:all

# Run tests
npm test

# Test API locally
npm run dev:api

# Test website locally
npm run dev:web
```

## 🔍 Troubleshooting

### Common Issues

1. **"Service not found" error**
   - Ensure you're in the correct directory for each service
   - Check that Railway CLI is properly linked to your project

2. **Build failures**
   - Verify all dependencies are installed: `npm run install:all`
   - Check Node.js version compatibility
   - Ensure Bun is available for API service

3. **Health check failures**
   - Verify API health endpoint: `/health`
   - Check that services are starting correctly
   - Review Railway logs for errors

### Debug Commands
```bash
# Check Railway status
railway status

# View service logs
railway logs

# Check environment variables
railway variables

# View deployment history
railway deployments
```

## 📊 Health Check Endpoints

- **API Health**: `https://your-api-service.railway.app/health`
- **Website**: `https://your-website-service.railway.app/`

## 🎯 Next Steps

1. **Set Environment Variables**: Configure all required environment variables
2. **Test Deployment**: Run the deployment script and monitor logs
3. **Verify Services**: Check that both API and Website are accessible
4. **Monitor Performance**: Use Railway dashboard for monitoring

## 📞 Support

- **Railway Documentation**: https://docs.railway.app/
- **Railway CLI**: `railway --help`
- **Project Dashboard**: Check your Railway project dashboard for real-time status

---

**Status**: ✅ Fixed and ready for deployment
**Last Updated**: $(date) 