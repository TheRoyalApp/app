# The Royal Barber - Command Reference

This document provides a comprehensive guide to all available commands in The Royal Barber project.

## Quick Start

```bash
# Initial setup
pnpm setup

# Start all services in development mode
pnpm dev

# Run all tests
pnpm test

# Deploy all services
pnpm deploy
```

## Development Commands

### Start All Services
```bash
# Start all services in development mode (API, Mobile, Website)
pnpm dev

# Start individual services
pnpm dev:api          # Start API server with hot reload
pnpm dev:mobile       # Start mobile app (iOS)
pnpm dev:android      # Start mobile app (Android)
pnpm dev:web          # Start mobile app (Web)
pnpm dev:website      # Start website server
```

### Production Start
```bash
# Start services in production mode
pnpm start            # Start API only
pnpm start:api        # Start API server
pnpm start:mobile     # Start mobile app
pnpm start:website    # Start website
pnpm start:all        # Start API and website concurrently
```

## Build Commands

```bash
# Build all services
pnpm build

# Build individual services
pnpm build:api        # Build API (TypeScript runtime - no build needed)
pnpm build:mobile     # Build mobile app
pnpm build:website    # Build website (static - no build needed)

# Mobile-specific builds
pnpm build:android    # Build Android app
pnpm build:ios        # Build iOS app
pnpm build:web        # Build web version
```

## Testing Commands

### Run All Tests
```bash
# Run tests for all services
pnpm test

# Run tests for individual services
pnpm test:api         # Run API tests
pnpm test:mobile      # Run mobile app tests
pnpm test:website     # Run website tests
```

### API Testing (Comprehensive)
```bash
# API test variations
pnpm test:api:all           # Run all API tests
pnpm test:api:appointments  # Test appointment functionality
pnpm test:api:production    # Run production test suite
pnpm test:api:coverage      # Run tests with coverage
pnpm test:api:comprehensive # Run comprehensive test suite
pnpm test:api:full          # Run full production tests
```

### Mobile Testing
```bash
# Mobile app test variations
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm test:ci          # Run tests for CI/CD
```

## Database Commands

### Schema Management
```bash
# Generate database schema
pnpm db:generate          # Generate new migration
pnpm db:generate:watch    # Watch for schema changes and generate migrations

# Apply migrations
pnpm db:migrate           # Run pending migrations
pnpm db:push              # Push schema changes directly
pnpm db:studio            # Open Drizzle Studio
```

### Database Setup
```bash
# Setup database
pnpm db:setup             # Setup database using Node.js script
pnpm db:setup:bash        # Setup database using bash script
pnpm db:setup:create      # Create database and setup
pnpm db:setup:force       # Force recreate database
```

## Seeding Commands

```bash
# Seed all data
pnpm seed                 # Alias for seed:all
pnpm seed:all            # Seed users, services, schedules, and Stripe products

# Seed individual data types
pnpm seed:users          # Seed user accounts
pnpm seed:services       # Seed barber services
pnpm seed:schedules      # Seed barber schedules
```

## Deployment Commands

```bash
# Deploy all services
pnpm deploy              # Alias for deploy:all
pnpm deploy:all          # Deploy API and website

# Deploy individual services
pnpm deploy:api          # Deploy API to Railway
pnpm deploy:website      # Deploy website to Railway
```

## Utility Commands

### Installation & Cleanup
```bash
# Install dependencies
pnpm install:all         # Install dependencies for all services

# Cleanup
pnpm clean               # Remove node_modules and build artifacts
pnpm clean:install       # Clean and reinstall all dependencies
```

### Development Workflow
```bash
# Setup project
pnpm setup               # Install, setup DB, and seed data
pnpm reset               # Clean install, force DB setup, and seed
pnpm fresh               # Complete fresh start (clean + setup + force DB + seed)
```

### Utilities
```bash
# Cron jobs
pnpm cron:reminders      # Run appointment reminder cron job

# Code quality (placeholder commands)
pnpm lint                # Lint code (not configured yet)
pnpm lint:fix            # Fix linting issues (not configured yet)
pnpm format              # Format code (not configured yet)
pnpm format:check        # Check code formatting (not configured yet)
```

## Service-Specific Commands

### API Service
```bash
cd apps/api

# Development
bun run src/index        # Start API server
bun --watch src/         # Start with hot reload

# Testing
bun run tests/test-endpoints.js
bun run tests/test-appointments.js
bun test tests/production-test-suite.test.ts

# Database
drizzle-kit generate     # Generate migrations
drizzle-kit migrate      # Run migrations
drizzle-kit studio       # Open Drizzle Studio

# Seeding
bun run src/db/seed-users.ts
bun run src/db/seed-services.ts
bun run src/db/seed-schedules.ts
```

### Mobile App
```bash
cd apps/app

# Development
expo start               # Start Expo development server
expo start --ios         # Start iOS simulator
expo start --android     # Start Android emulator
expo start --web         # Start web version

# Testing
jest --watchAll          # Run tests in watch mode
jest --coverage          # Run tests with coverage
```

### Website
```bash
cd apps/website

# Development
serve -s . -p 3000       # Start development server
serve -s . -p $PORT      # Start production server
```

## Environment Variables

Make sure to set up the following environment variables:

### API (.env)
```bash
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### Mobile App (app.config.js)
```bash
EXPO_PUBLIC_API_URL=your_api_url
```

## Troubleshooting

### Common Issues

1. **Database connection issues**: Run `pnpm db:setup:force` to recreate the database
2. **Dependency issues**: Run `pnpm clean:install` to clean and reinstall
3. **Build issues**: Run `pnpm fresh` for a complete reset
4. **Test failures**: Check that the API is running before running tests

### Reset Everything
```bash
# Complete project reset
pnpm fresh
```

This will:
- Clean all node_modules and build artifacts
- Reinstall all dependencies
- Force recreate the database
- Seed all data
- Set up the project from scratch 