#!/bin/bash

# Production-safe database index deployment script
# This script creates indexes concurrently to avoid blocking operations

set -e

echo "🚀 Starting database index deployment..."
echo "⚠️  This will create indexes concurrently to avoid blocking operations"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        echo "❌ ERROR: psql is not installed. Please install PostgreSQL client tools."
        exit 1
    fi
}

# Function to test database connection
test_connection() {
    echo "🔍 Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ ERROR: Could not connect to database"
        exit 1
    fi
}

# Function to create indexes
create_indexes() {
    echo "📊 Creating performance indexes..."
    
    # Execute the index creation script
    if psql "$DATABASE_URL" -f "src/db/migrations/0008_add_performance_indexes.sql"; then
        echo "✅ Indexes created successfully"
    else
        echo "❌ ERROR: Failed to create indexes"
        exit 1
    fi
}

# Function to verify indexes
verify_indexes() {
    echo "🔍 Verifying indexes were created..."
    
    # Count the number of indexes created
    INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE indexname LIKE 'idx_%' 
        AND schemaname = 'public';
    " | tr -d '[:space:]')
    
    echo "📈 Found $INDEX_COUNT performance indexes"
    
    if [ "$INDEX_COUNT" -gt 0 ]; then
        echo "✅ Index verification successful"
    else
        echo "⚠️  Warning: No performance indexes found"
    fi
}

# Main execution
main() {
    check_psql
    test_connection
    create_indexes
    verify_indexes
    
    echo ""
    echo "🎉 Database index deployment completed successfully!"
    echo "📊 Your database is now optimized for production performance"
}

# Run the script
main