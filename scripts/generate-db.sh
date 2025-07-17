#!/bin/bash

# The Royal Barber Database Generation Script
# This script generates the database using the db.sql file

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-the_royal_barber}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔌${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Function to show help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -f, --force         Force execution even if database exists"
    echo "  -c, --create-db     Create database if it doesn't exist"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST             PostgreSQL host (default: localhost)"
    echo "  DB_PORT             PostgreSQL port (default: 5432)"
    echo "  DB_NAME             Database name (default: the_royal_barber)"
    echo "  DB_USER             Database user (default: postgres)"
    echo "  DB_PASSWORD         Database password"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  DB_HOST=myhost DB_USER=myuser $0"
    echo "  $0 --create-db"
}

# Parse command line arguments
FORCE=false
CREATE_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -c|--create-db)
            CREATE_DB=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "psql is not installed or not in PATH"
    print_warning "Please install PostgreSQL client tools"
    exit 1
fi

# Check if SQL file exists
SQL_FILE="db.sql"
if [[ ! -f "$SQL_FILE" ]]; then
    print_error "SQL file not found: $SQL_FILE"
    print_warning "Make sure you're running this script from the project root"
    exit 1
fi

print_status "Starting database generation..."

# Set PGPASSWORD if provided
if [[ -n "$DB_PASSWORD" ]]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Check if database exists
print_status "Checking if database '$DB_NAME' exists..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" &> /dev/null; then
    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | grep -c 1 || echo "0")
    
    if [[ "$DB_EXISTS" -eq 1 ]]; then
        if [[ "$FORCE" == true ]]; then
            print_warning "Database '$DB_NAME' already exists. Proceeding with force flag..."
        else
            print_error "Database '$DB_NAME' already exists!"
            print_warning "Use --force flag to proceed anyway, or --create-db to recreate it"
            exit 1
        fi
    else
        if [[ "$CREATE_DB" == true ]]; then
            print_status "Creating database '$DB_NAME'..."
            createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
            print_success "Database '$DB_NAME' created successfully"
        else
            print_error "Database '$DB_NAME' does not exist!"
            print_warning "Use --create-db flag to create it automatically"
            exit 1
        fi
    fi
else
    print_error "Cannot connect to PostgreSQL server"
    print_warning "Check your connection settings:"
    print_warning "  Host: $DB_HOST"
    print_warning "  Port: $DB_PORT"
    print_warning "  User: $DB_USER"
    exit 1
fi

# Execute the SQL file
print_status "Executing database schema..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"; then
    print_success "Database schema created successfully!"
else
    print_error "Failed to execute database schema"
    exit 1
fi

# Verify tables were created
print_status "Verifying tables..."
TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
" 2>/dev/null | grep -v '^$' | tr '\n' ' ')

if [[ -n "$TABLES" ]]; then
    print_success "Created tables:"
    for table in $TABLES; do
        echo "  - $table"
    done
    echo ""
    print_success "Database generation completed successfully!"
    echo "📊 Total tables created: $(echo $TABLES | wc -w)"
else
    print_warning "No tables found after schema creation"
fi

# Clean up
unset PGPASSWORD 