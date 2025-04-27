import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a pool with more robust configuration for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  // Don't crash the server, but log the error
});

// Function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Successfully connected to database');
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Create Drizzle ORM instance
export const db = drizzle({ client: pool, schema });