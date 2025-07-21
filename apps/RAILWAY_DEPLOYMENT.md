# Railway Deployment Guide

This guide explains how to deploy The Royal Barber monorepo to Railway.

## Project Structure

```
apps/
├── api/           # Backend API service
├── website/       # Frontend web service
├── app/           # React Native mobile app (not deployed to Railway)
├── railway.json   # Root Railway configuration
├── package.json   # Root package.json for monorepo
└── deploy.sh      # Deployment script
```

## Services

### 1. API Service (`api/`)
- **Runtime**: Bun
- **Port**: 8080 (configurable via PORT env var)
- **Health Check**: `/health`
- **Start Command**: `bun run src/index.ts`

### 2. Website Service (`website/`)
- **Runtime**: Node.js
- **Port**: 3000 (configurable via PORT env var)
- **Health Check**: `/`
- **Start Command**: `npm start`

## Environment Variables

### API Service Required Variables
```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-jwt-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App Configuration
NODE_ENV=production
```

### Website Service Required Variables
```bash
# API URL (for frontend to communicate with backend)
REACT_APP_API_URL=https://your-api-service.railway.app
```

## Deployment Steps

### 1. Initial Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link -p YOUR_PROJECT_ID
```

### 2. Deploy
```bash
# Option 1: Use the deployment script
./deploy.sh

# Option 2: Manual deployment
npm run install:all
npm test
npm run build
railway up
```

### 3. Set Environment Variables
```bash
# Set API environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="your-jwt-secret"
# ... add all required variables

# Set website environment variables
railway variables set REACT_APP_API_URL="https://your-api-service.railway.app"
```

## Railway Configuration

### Root Configuration (`railway.json`)
- Uses Nixpacks builder
- Health check on `/health`
- Automatic restart on failure

### API Configuration (`api/railway.json`)
- Bun runtime
- Health check on `/health`
- Start command: `bun run src/index.ts`

### Website Configuration (`website/railway.json`)
- Node.js runtime
- Health check on `/`
- Start command: `npm start`

## Monitoring

### Health Checks
- API: `https://your-api-service.railway.app/health`
- Website: `https://your-website-service.railway.app/`

### Logs
```bash
# View logs for all services
railway logs

# View logs for specific service
railway logs --service api
railway logs --service website
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are properly installed
   - Verify Node.js version compatibility
   - Check for TypeScript compilation errors

2. **Runtime Errors**
   - Verify all environment variables are set
   - Check database connectivity
   - Review application logs

3. **Health Check Failures**
   - Ensure the health check endpoints are accessible
   - Verify the application is starting correctly
   - Check port configuration

### Debug Commands
```bash
# Check Railway status
railway status

# View service details
railway service

# Check environment variables
railway variables

# View deployment history
railway deployments
```

## Development

### Local Development
```bash
# Start all services locally
npm run dev

# Start individual services
npm run dev:api
npm run dev:web
```

### Testing
```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api
npm run test:web
```

## Security Notes

1. **Environment Variables**: Never commit sensitive environment variables to version control
2. **Database**: Use Railway's PostgreSQL service for production database
3. **SSL**: Railway automatically provides SSL certificates
4. **CORS**: Configure CORS properly for production domains

## Support

For Railway-specific issues, refer to the [Railway Documentation](https://docs.railway.app/). 