#!/bin/bash

# Production database setup script
echo "Setting up production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Database URL configured: ${DATABASE_URL:0:20}..."

# Run database migrations using drizzle-kit
echo "Running drizzle database migrations..."
npx drizzle-kit push --config=drizzle.config.ts

# Check if the push was successful
if [ $? -eq 0 ]; then
    echo "Database migration completed successfully!"
else
    echo "Database migration failed!"
    exit 1
fi

# Run any additional migrations
if [ -f "setup_db.sql" ]; then
    echo "Running additional SQL setup..."
    psql $DATABASE_URL -f setup_db.sql
fi

# Run onboarding migration if needed
if [ -f "add_onboarding_flag.sql" ]; then
    echo "Running onboarding migration..."
    psql $DATABASE_URL -f add_onboarding_flag.sql
fi

echo "Database setup complete!"
