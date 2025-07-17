# Database Generation Scripts

This directory contains scripts to generate the PostgreSQL database for The Royal Barber application.

## Files

- `generate-db.js` - Node.js script using `pg` library
- `generate-db.sh` - Bash script using `psql` directly
- `db.sql` - SQL schema file (located in project root)

## Prerequisites

### For Node.js script:
```bash
npm install pg dotenv
```

### For Bash script:
- PostgreSQL client tools (`psql`, `createdb`)
- Bash shell

## Usage

### Option 1: Node.js Script

```bash
# Basic usage
node scripts/generate-db.js

# With environment variables
DB_HOST=localhost DB_USER=myuser DB_PASSWORD=mypass node scripts/generate-db.js

# Show help
node scripts/generate-db.js --help
```

### Option 2: Bash Script

```bash
# Basic usage
./scripts/generate-db.sh

# Create database if it doesn't exist
./scripts/generate-db.sh --create-db

# Force execution even if database exists
./scripts/generate-db.sh --force

# With environment variables
DB_HOST=localhost DB_USER=myuser DB_PASSWORD=mypass ./scripts/generate-db.sh

# Show help
./scripts/generate-db.sh --help
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `the_royal_barber` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | (empty) | Database password |
| `DB_SSL` | `false` | Enable SSL (Node.js only) |

## Database Schema

The generated database includes:

### Tables
- `users` - User management with authentication
- `services` - Barber services with Stripe integration
- `schedules` - Barber availability schedules
- `appointments` - Booking appointments
- `payments` - Payment tracking

### Features
- UUID primary keys
- Foreign key relationships
- Performance indexes
- Automatic `updated_at` triggers
- JSON storage for time slots
- Stripe integration fields

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Check connection settings (host, port, user, password)
- Verify database exists (use `--create-db` flag)

### Permission Issues
- Make sure the database user has proper permissions
- For bash script: `chmod +x scripts/generate-db.sh`

### Missing Dependencies
- Node.js script: `npm install pg dotenv`
- Bash script: Install PostgreSQL client tools

## Examples

### Local Development
```bash
# Create database and schema
createdb the_royal_barber
./scripts/generate-db.sh
```

### Production Setup
```bash
# With custom settings
DB_HOST=my-production-host \
DB_NAME=royal_barber_prod \
DB_USER=app_user \
DB_PASSWORD=secure_password \
./scripts/generate-db.sh --create-db
```

### Docker Environment
```bash
# Connect to PostgreSQL in Docker
DB_HOST=postgres \
DB_USER=postgres \
DB_PASSWORD=password \
./scripts/generate-db.sh --create-db
``` 