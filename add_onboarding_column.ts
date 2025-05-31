import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  console.log('Running migration to add onboarding_completed column to users table...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');
    
    try {
      // Add the onboarding_completed column if it doesn't exist
      const result = await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('Migration completed successfully!');
      
      // Check if column was added
      const checkResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'onboarding_completed';
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('Column details:', checkResult.rows[0]);
      }
      
    } catch (error: any) {
      // Check if it's a "column already exists" error
      if (error.code === '42701') {
        console.log('Column onboarding_completed already exists');
      } else {
        console.error('Error during migration:', error);
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
runMigration().catch(console.error);
