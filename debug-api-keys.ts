#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Debug script to verify API keys are loading correctly
 */
function debugApiKeys() {
  console.log('🔍 Checking API keys...');
  
  // Check OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    // Only show first 5 and last 5 characters for security
    const maskedKey = maskApiKey(openaiKey);
    console.log(`✅ OpenAI API Key found: ${maskedKey}`);
    console.log(`  Model version: ${process.env.OPENAI_MODEL_VERSION || 'Using default'}`);
  } else {
    console.log('❌ OpenAI API Key not found');
  }
  
  // Check Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    console.log(`✅ Anthropic API Key found: ${maskApiKey(anthropicKey)}`);
    console.log(`  Model version: ${process.env.ANTHROPIC_MODEL_VERSION || 'Using default'}`);
  } else {
    console.log('❌ Anthropic API Key not found');
  }
  
  // Check Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log(`✅ Gemini API Key found: ${maskApiKey(geminiKey)}`);
    console.log(`  Model version: ${process.env.GEMINI_MODEL_VERSION || 'Using default'}`);
  } else {
    console.log('❌ Gemini API Key not found');
  }
  
  // Check Azure
  const azureKey = process.env.AZURE_API_KEY;
  const azureEndpoint = process.env.AZURE_ENDPOINT;
  if (azureKey && azureEndpoint) {
    console.log(`✅ Azure API Key found: ${maskApiKey(azureKey)}`);
    console.log(`  Endpoint: ${azureEndpoint}`);
    console.log(`  Deployment name: ${process.env.AZURE_DEPLOYMENT_NAME || 'Using default'}`);
  } else {
    console.log('❌ Azure API Key or Endpoint not found');
  }
  
  // Check default provider
  const defaultProvider = process.env.DEFAULT_VISION_PROVIDER;
  if (defaultProvider) {
    console.log(`✅ Default provider: ${defaultProvider}`);
  } else {
    console.log('❌ Default provider not set (will use first available)');
  }
  
  console.log('\n📝 If you see missing keys above, please add them to your .env file');
  console.log('For example:');
  console.log('OPENAI_API_KEY=sk-yourkeyhere');
  console.log('GEMINI_API_KEY=AIza-yourkeyhere');
}

/**
 * Mask an API key for security
 * @param key The API key to mask
 * @returns Masked key (first 4 and last 4 characters visible)
 */
function maskApiKey(key: string): string {
  if (key.length <= 10) {
    return '****';
  }
  
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// Run the debug
debugApiKeys();
