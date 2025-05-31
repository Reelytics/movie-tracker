#!/usr/bin/env node

import { client } from './server/db.ts';

async function runMigration() {
  console.log('Running migration to add onboarding_completed column to users table...');
  
  try {
    // Connect to the database
    await client.connect();
    
    try {
      // Add the onboarding_completed column if it doesn't exist
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the migration
runMigration().catch(console.error);
