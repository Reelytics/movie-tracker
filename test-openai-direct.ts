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
 * Test script for OpenAI Vision API directly
 */
async function testOpenAIVision() {
  console.log('🧪 Testing OpenAI Vision API directly...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ No OpenAI API key found in .env file.');
    console.log('Please add OPENAI_API_KEY to your .env file.');
    process.exit(1);
  }
  
  console.log(`✅ Found OpenAI API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
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
        'https://api.openai.com/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      console.log('✅ Models API response:', modelsResponse.status);
      
      // Filter for vision models
      const allModels = modelsResponse.data.data || [];
      const visionModels = allModels.filter(model => 
        model.id && (model.id.includes('gpt-4') || model.id.includes('vision'))
      );
      
      console.log(`Found ${allModels.length} models, showing GPT-4 and Vision-capable models:`);
      visionModels.forEach(model => {
        console.log(`- ${model.id}`);
      });
      
      // Find a vision-capable model from the list
      let bestModelName = 'gpt-4-turbo';
      
      // Look for models with 'vision' or recent gpt-4 models
      const visionCapableModels = visionModels.filter(model => 
        model.id.includes('vision') || model.id === 'gpt-4o' || model.id === 'gpt-4-turbo'
      );
      
      if (visionCapableModels.length > 0) {
        // Prioritize models in this order: gpt-4o, gpt-4-turbo, then any with vision
        if (visionCapableModels.some(m => m.id === 'gpt-4o')) {
          bestModelName = 'gpt-4o';
        } else if (visionCapableModels.some(m => m.id === 'gpt-4-turbo')) {
          bestModelName = 'gpt-4-turbo';
        } else {
          bestModelName = visionCapableModels[0].id;
        }
      }
      
      console.log(`\n🔍 Will use model: ${bestModelName}`);
      
      // Now test the vision API
      console.log('\n🖼️ Testing vision API...');
      
      const visionPayload = {
        model: bestModelName,
        messages: [
          {
            role: "system",
            content: `You are a specialized movie ticket information extraction system.
Your task is to extract ONLY the following specific fields from a movie ticket image and format them in a JSON object:

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

For each field, return only the exact text as seen on the ticket. Use null for any field not visible on the ticket. Do not add any descriptions, explanations, or additional text.

Your ENTIRE response must be ONLY the JSON object. Do not include any other text whatsoever.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract only the ticket information from this movie ticket image. Respond with ONLY a valid JSON object containing the specified fields. No additional text."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      };
      
      const visionResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        visionPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      console.log('✅ Vision API response:', visionResponse.status);
      
      const content = visionResponse.data.choices?.[0]?.message?.content || 'No content returned';
      console.log('\n📝 Model response:');
      console.log(content);
      
      // Try to parse as JSON
      try {
        const jsonContent = JSON.parse(content);
        console.log('\n✅ Successfully parsed as JSON!');
        console.log('\n📊 Parsed ticket data:');
        console.table(jsonContent);
      } catch (error) {
        console.error('\n❌ Failed to parse response as JSON:', error.message);
      }
      
    } catch (error) {
      console.error('❌ Error with OpenAI API:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing OpenAI Vision API:', error);
    process.exit(1);
  }
}

// Run the test
testOpenAIVision().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
