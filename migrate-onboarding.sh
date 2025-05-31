#!/bin/bash

# Running the onboarding migration script to ensure the database has the onboarding_completed column
echo "Migrating database for onboarding support..."
cd "$(dirname "$0")"
node --experimental-modules --loader tsx add_onboarding_column.js

# Log success
echo "Migration complete. Onboarding column added to users table."
