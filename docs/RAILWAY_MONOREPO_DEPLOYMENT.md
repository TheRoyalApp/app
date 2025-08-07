# Railway Monorepo Deployment Guide

This guide explains how to deploy The Royal Barber monorepo to Railway using pnpm workspaces with separate services for API and Website.

## Architecture

The monorepo is configured to deploy two separate Railway services:

- **API Service** (`apps/api`) - Backend API using Bun/Node.js
- **Website Service** (`apps/website`) - Static website using Node.js/Hono

## Prerequisites

1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account and project set up
3. pnpm installed locally for development

## Project Structure

```
the_royal_barber/
├── package.json           # Root workspace configuration
├── pnpm-workspace.yaml    # pnpm workspace definition
├── railway.json           # Default Railway config (points to API)
├── nixpacks.toml          # Root build configuration
├── apps/
│   ├── api/
│   │   ├── package.json   # API service dependencies
│   │   ├── railway.json   # API Railway configuration
│   │   └── nixpacks.toml  # API build configuration
│   └── website/
│       ├── package.json   # Website service dependencies
│       ├── railway.json   # Website Railway configuration
│       └── nixpacks.toml  # Website build configuration
└── scripts/
    └── deploy-railway.sh  # Deployment helper script
```

## Environment Variables

Both services use `NODE_ENV=DEVELOPMENT` by default. Set the following in Railway:

### API Service
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API secret
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- Any other environment variables from `apps/api/env.example`

### Website Service
- No specific environment variables required (static site)

## Deployment Options

### Option 1: Using the Deployment Script

```bash
# Deploy both services
./scripts/deploy-railway.sh all

# Deploy only API
./scripts/deploy-railway.sh api

# Deploy only website
./scripts/deploy-railway.sh website
```

### Option 2: Manual Deployment

#### Deploy API Service
```bash
cd apps/api
railway up --service api
```

#### Deploy Website Service
```bash
cd apps/website
railway up --service website
```

### Option 3: Using pnpm Scripts

```bash
# Deploy API
pnpm railway:api

# Deploy website
pnpm railway:website
```

## Railway Service Configuration

### Creating Services in Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Create two services:
   - `api` - Deploy from `apps/api` directory
   - `website` - Deploy from `apps/website` directory

### Service Settings

For each service, configure:

1. **Root Directory**: Set to the appropriate app directory
   - API: `apps/api`
   - Website: `apps/website`

2. **Build Command**: Handled by nixpacks.toml (automatic)

3. **Start Command**: Handled by nixpacks.toml (automatic)

4. **Watch Paths**: Configured in railway.json to only trigger rebuilds when relevant files change

## Build Process

The build process uses pnpm workspaces to handle dependencies:

1. **Install**: `pnpm install --frozen-lockfile` (installs all workspace dependencies)
2. **Build**: `pnpm --filter <service> build` (builds specific service)
3. **Start**: `pnpm --filter <service> start` (starts specific service)

### Build Optimization

- Uses `--frozen-lockfile` for faster, deterministic installs
- Leverages pnpm workspace dependency sharing
- Watch patterns prevent unnecessary rebuilds
- Separate nixpacks.toml for service-specific optimizations

## Troubleshooting

### Common Issues

1. **Build fails with pnpm not found**
   - Ensure nixpacks.toml includes pnpm in nixPkgs

2. **Service can't find dependencies**
   - Check that pnpm workspace filters match package names exactly
   - Verify pnpm-workspace.yaml includes the correct paths

3. **Environment variables not working**
   - Ensure NODE_ENV is set to 'DEVELOPMENT' in Railway dashboard
   - Verify all required environment variables are configured

4. **Build command fails**
   - Check that the build command in nixpacks.toml navigates to monorepo root
   - Ensure package.json scripts exist and are executable

### Debugging Commands

```bash
# Test workspace configuration locally
pnpm --filter api start
pnpm --filter the-royal-barber-website start

# Verify workspace setup
pnpm list --depth=0
pnpm why <package-name>

# Test build process
pnpm run build:api
pnpm run build:website
```

## Development Workflow

1. Make changes to your service
2. Test locally using pnpm workspace commands
3. Commit changes to git
4. Deploy using one of the deployment options above
5. Monitor deployment in Railway dashboard

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Nixpacks Documentation](https://nixpacks.com/)

## Support

For deployment issues:
1. Check Railway service logs
2. Verify environment variables
3. Test build commands locally
4. Review this documentation for common issues 