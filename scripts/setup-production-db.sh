#!/bin/bash

# Production database setup script
echo "Setting up production database..."

# Run database migrations
npm run db:push

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
