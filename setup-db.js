#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get the SQL script
const sql = fs.readFileSync('./setup_db.sql', 'utf-8');

async function setupDb() {
  console.log('Setting up database tables...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Execute SQL script
    await client.query(sql);
    console.log('Database tables created/updated successfully');
    
    // Verify movie_tickets table
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'movie_tickets'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('movie_tickets table exists!');
    } else {
      console.error('Failed to create movie_tickets table');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Execute the setup
setupDb();