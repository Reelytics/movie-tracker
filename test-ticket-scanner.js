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
 * Test script for Ticket Scanner with Gemini Vision
 */
async function testTicketScanner() {
  console.log('🔍 Testing Ticket Scanner with Gemini Vision...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No Gemini API key found in .env file.');
    console.log('Please add GEMINI_API_KEY to your .env file.');
    process.exit(1);
  }
  
  console.log(`✅ Found Gemini API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Look for test images in the uploads/tickets directory
  const uploadsDir = path.join(__dirname, 'uploads', 'tickets');
  
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ Directory not found: ${uploadsDir}`);
    console.log('Please make sure the uploads/tickets directory exists.');
    process.exit(1);
  }
  
  // Check if there are ticket images
  const files = fs.readdirSync(uploadsDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff'].includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log(`❌ No ticket images found in ${uploadsDir}`);
    console.log('Please add ticket images to this directory and run the script again.');
    process.exit(1);
  }
  
  const imagePath = path.join(uploadsDir, imageFiles[0]);
  console.log(`📸 Using ticket image: ${imageFiles[0]}`);
  
  try {
    // Read image file as Base64
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`ℹ️ Image size: ${(base64Image.length * 0.75 / 1000).toFixed(2)} KB`);
    
    // Use the model from env or default
    const modelName = process.env.GEMINI_MODEL_VERSION || 'gemini-1.5-flash';
    console.log(`🔍 Using model: ${modelName}`);
    
    // Create the payload with the enhanced prompt
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

For each field, return only the exact text as seen on the ticket. Use null for any field not visible on the ticket. Do not add any descriptions, explanations, or additional text. ONLY return the JSON object.

Pay special attention to look for key information areas on the ticket, and be very precise about extracting the movie title exactly as it appears, as this is the most critical field.`
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
    
    console.log('🚀 Sending request to Gemini Vision API...');
    
    const visionResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
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
    
    // Try to parse the JSON response
    try {
      let ticketData;
      // First attempt: Try to parse the whole response as JSON
      try {
        ticketData = JSON.parse(content);
      } catch (e) {
        // Second attempt: Try to extract JSON from text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          ticketData = JSON.parse(jsonStr);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
      
      console.log('\n✅ Structured Ticket Data:');
      console.log(JSON.stringify(ticketData, null, 2));
      
      console.log('\n🎬 Your ticket scanner is now ready to use!');
      console.log('Try scanning a ticket in the app using the scan button.');
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON from response:', jsonError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Gemini Vision API:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testTicketScanner().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
