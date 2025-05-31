import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Load environment variables from .env file
const result = config({ path: resolve(rootDir, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
  // Log the DATABASE_URL to debug (without showing the full password)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const maskedUrl = dbUrl.replace(/(postgresql:\/\/[^:]+:)[^@]+(@.+)/, '$1****$2');
    console.log(`Database URL: ${maskedUrl}`);
  } else {
    console.warn('DATABASE_URL is not set in the .env file');
  }
}
