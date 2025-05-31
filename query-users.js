import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function queryUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('\nQuerying all users...');
    const result = await client.query('SELECT * FROM users');
    
    console.log('\nUser records:');
    console.table(result.rows);
    
    console.log(`\nTotal users: ${result.rowCount}`);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the query function
queryUsers();
