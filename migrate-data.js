// Data migration script
import { Client } from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function migrateData() {
  console.log('MovieTracker Data Migration Tool');
  console.log('===============================\n');
  
  // Prompt for Replit database connection info
  rl.question('Enter Replit PostgreSQL connection string: ', async (replitDbUrl) => {
    try {
      // Source database (Replit)
      const sourceClient = new Client({
        connectionString: replitDbUrl
      });
      
      // Target database (local)
      const targetClient = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      console.log('Connecting to databases...');
      
      await sourceClient.connect();
      console.log('Connected to source database (Replit)');
      
      await targetClient.connect();
      console.log('Connected to target database (Local)');
      
      // Migrate users
      console.log('\nMigrating users...');
      const users = await sourceClient.query('SELECT * FROM users');
      for (const user of users.rows) {
        try {
          await target