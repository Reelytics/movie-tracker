#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Get the directory name 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script for Gemini Vision API directly
 */
async function testGeminiVision() {
  console.log('🧪 Testing Gemini Vision API directly...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No Gemini API key found in .env file.');
    console.log('Please add GEMINI_API_KEY to your .env file.');
    process.exit(1);
  }
  
  console.log(`✅ Found Gemini API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Create test directory if it doesn't exist
  const testDir = path.join(__dirname, 'tests', 'vision');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`Created test directory: ${testDir}`);
    
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
  
  const imagePath = path.join(testDir, imageFiles[0]);
  console.log(`📸 Using test image: ${imageFiles[0]}`);
  
  try {
    // Read image file as Base64
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`ℹ️ Image size: ${(base64Image.length * 0.75 / 1000).toFixed(2)} KB`);
    
    // First test: Check available models
    console.log('\n📋 Testing available models...');
    try {
      const modelsResponse = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Models API response:', modelsResponse.status);
      
      // Filter for vision models
      const allModels = modelsResponse.data.models || [];
      const visionModels = allModels.filter(model => 
        model.name && model.name.includes('vision')
      );
      
      console.log(`Found ${allModels.length} models, ${visionModels.length} with vision capabilities:`);
      visionModels.forEach(model => {
        console.log(`- ${model.name} (${model.version || 'unknown version'})`);
      });
      
      // Find the best model to use
      let bestModelName = 'gemini-1.5-flash';
      console.log(`\n🔍 Will use recommended model: ${bestModelName}`);
      
      // Now test the vision API
      console.log('\n🖼️ Testing vision API...');
      
      const visionPayload = {
        contents: [
          {
            parts: [
              {
                text: `You are a specialized movie ticket information extraction system. 
Extract ONLY the following fields from the movie ticket image and format the result as a JSON object:

{
  "movieTitle": "Title of the movie exactly as shown on ticket", 
  "showTime": "Time of the showing (e.g. 6:45pm)",
  "showDate": "Date of the showing (e.g. Mon 01/15/2024)",
  "price": "Ticket price (e.g. $14.99)",
  "seatNumber": "Seat assignment (e.g. L6)",
  "movieRating": "Movie rating (e.g. PG, PG-13, R)",
  "theaterRoom": "Theater/auditorium number (e.g. Theater 4)",
  "ticketNumber": "Ticket identifier number",
  "theaterName": "Name of the theater location (e.g. Assembly Row)",
  "theaterChain": "Theater company name (e.g. AMC, Regal)",
  "ticketType": "Type of ticket (e.g. Adult, Child, Senior)"
}

For each field, return only the exact text as seen on the ticket. Use null for any field not visible on the ticket. Do not add any descriptions, explanations, or additional text. ONLY return the JSON object.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        }
      };
      
      const visionResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/${bestModelName}:generateContent?key=${apiKey}`,
        visionPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Vision API response:', visionResponse.status);
      
      const content = visionResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content returned';
      console.log('\n📝 Model response:');
      console.log(content);
      
    } catch (error) {
      console.error('❌ Error testing models API:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini Vision API:', error);
    process.exit(1);
  }
}

// Run the test
testGeminiVision().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
