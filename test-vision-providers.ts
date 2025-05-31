#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import VisionProviderTest from './server/services/vision/visionProviderTest';

// Load environment variables
dotenv.config();

// Get the directory name 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script for vision providers
 * This allows testing the vision APIs from the command line
 */
async function runTests() {
  console.log('🧪 Testing vision providers...');
  
  // Create test directory if it doesn't exist
  const testDir = path.join(__dirname, 'tests', 'vision');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`Created test directory: ${testDir}`);
    
    // Add a README to help users add test images
    const readmePath = path.join(testDir, 'README.txt');
    fs.writeFileSync(
      readmePath,
      'Place movie ticket test images in this directory to test vision providers.\n' +
      'Images should be JPEG, PNG, or other common image formats.\n'
    );
    
    console.log(`ℹ️ Please add test images to ${testDir} before running tests`);
    console.log('Exiting...');
    process.exit(0);
  }
  
  // Check if there are test images
  const files = fs.readdirSync(testDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff'].includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log(`❌ No test images found in ${testDir}`);
    console.log('Please add test images and run the script again.');
    process.exit(1);
  }
  
  console.log(`Found ${imageFiles.length} test images.`);
  
  try {
    // Run tests for all providers
    console.log('Running tests...');
    const results = await VisionProviderTest.testAllProviders();
    
    if (results.size === 0) {
      console.log('❌ No vision providers available for testing.');
      console.log('Please check your .env file and add API keys for at least one provider.');
      process.exit(1);
    }
    
    console.log('\n🔍 Results by provider:');
    for (const [providerName, providerResults] of results.entries()) {
      console.log(`\n${providerName}:`);
      
      if (!providerResults.connected) {
        console.log(`  ❌ Connection failed: ${providerResults.error || 'Unknown error'}`);
        continue;
      }
      
      console.log('  ✅ Connection successful');
      
      if (!providerResults.results || providerResults.results.length === 0) {
        console.log('  ❓ No test results available');
        continue;
      }
      
      const successCount = providerResults.results.filter((r) => r.success).length;
      const totalCount = providerResults.results.length;
      
      console.log(`  Tests completed: ${successCount}/${totalCount} successful`);
      
      for (const result of providerResults.results) {
        console.log(`\n  📝 Test for ${result.imageName}:`);
        console.log(`    ${result.success ? '✅ Success' : '❌ Failed'}`);
        
        if (!result.success) {
          console.log(`    Error: ${result.error || 'Unknown error'}`);
          continue;
        }
        
        // Print extracted data
        console.log('    Extracted data:');
        console.log(`      Movie Title: ${result.data.movieTitle || 'Not found'}`);
        console.log(`      Show Time: ${result.data.showTime || 'Not found'}`);
        console.log(`      Show Date: ${result.data.showDate || 'Not found'}`);
        console.log(`      Price: ${result.data.price || 'Not found'}`);
        console.log(`      Seat Number: ${result.data.seatNumber || 'Not found'}`);
        console.log(`      Movie Rating: ${result.data.movieRating || 'Not found'}`);
        console.log(`      Theater Room: ${result.data.theaterRoom || 'Not found'}`);
        console.log(`      Ticket Number: ${result.data.ticketNumber || 'Not found'}`);
        console.log(`      Theater Name: ${result.data.theaterName || 'Not found'}`);
        console.log(`      Theater Chain: ${result.data.theaterChain || 'Not found'}`);
        console.log(`      Ticket Type: ${result.data.ticketType || 'Not found'}`);
      }
    }
    
    // Compare results across providers
    if (results.size > 1) {
      console.log('\n🔄 Comparison of results across providers:');
      const comparison = VisionProviderTest.compareResults(results);
      
      for (const imageComparison of comparison.imageComparisons) {
        console.log(`\n📊 Image: ${imageComparison.imageName}`);
        console.log('Field agreement levels:');
        
        for (const [field, agreement] of Object.entries(imageComparison.fieldAgreement)) {
          const agreementData = agreement as any;
          console.log(`  ${field}: ${agreementData.agreement} agreement (${agreementData.providers} providers) - Value: "${agreementData.value || 'Not found'}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
