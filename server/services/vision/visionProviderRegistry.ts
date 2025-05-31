import { VisionProvider, VisionProviderOptions } from './types';
import { OpenAIVisionProvider } from './openaiVisionProvider';
import { AnthropicVisionProvider } from './anthropicVisionProvider';
import { GeminiVisionProvider } from './geminiVisionProvider';
import { AzureVisionProvider } from './azureVisionProvider';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Registry for managing and accessing different vision API providers
 */
class VisionProviderRegistry {
  private providers: Map<string, VisionProvider>;
  private activeProvider: string | null;
  
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    
    // Initialize providers from environment variables
    this.initializeProviders();
  }
  
  /**
   * Initialize available providers based on environment variables
   */
  private initializeProviders(): void {
    // Initialize OpenAI if API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      this.registerProvider(
        new OpenAIVisionProvider({
          apiKey: openaiApiKey,
          modelVersion: process.env.OPENAI_MODEL_VERSION
        })
      );
    }
    
    // Initialize Anthropic if API key is available
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicApiKey) {
      this.registerProvider(
        new AnthropicVisionProvider({
          apiKey: anthropicApiKey,
          modelVersion: process.env.ANTHROPIC_MODEL_VERSION
        })
      );
    }
    
    // Initialize Google Gemini if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.registerProvider(
        new GeminiVisionProvider({
          apiKey: geminiApiKey,
          modelVersion: process.env.GEMINI_MODEL_VERSION
        })
      );
    }
    
    // Initialize Azure if required config is available
    const azureApiKey = process.env.AZURE_API_KEY;
    const azureEndpoint = process.env.AZURE_ENDPOINT;
    if (azureApiKey && azureEndpoint) {
      this.registerProvider(
        new AzureVisionProvider({
          apiKey: azureApiKey,
          endpoint: azureEndpoint,
          deploymentName: process.env.AZURE_DEPLOYMENT_NAME
        })
      );
    }
    
    // Set the default active provider if available
    const defaultProvider = process.env.DEFAULT_VISION_PROVIDER || 'Google Gemini Vision';
    if (this.providers.has(defaultProvider)) {
      this.activeProvider = defaultProvider;
      console.log(`Using configured provider: ${defaultProvider}`);
    } else if (this.providers.size > 0) {
      // Use the first available provider if default is not available
      this.activeProvider = Array.from(this.providers.keys())[0];
      console.log(`Default provider not available, using: ${this.activeProvider}`);
    }
    
    console.log(`Initialized vision providers: ${Array.from(this.providers.keys()).join(', ')}`);
    console.log(`Active vision provider: ${this.activeProvider || 'None'}`);
  }
  
  /**
   * Register a new provider
   * @param provider Provider implementation
   */
  registerProvider(provider: VisionProvider): void {
    this.providers.set(provider.name, provider);
    
    // Set as active provider if none is set
    if (!this.activeProvider) {
      this.activeProvider = provider.name;
    }
  }
  
  /**
   * Remove a provider from the registry
   * @param providerName Provider name to remove
   */
  removeProvider(providerName: string): void {
    this.providers.delete(providerName);
    
    // Update active provider if the removed one was active
    if (this.activeProvider === providerName) {
      if (this.providers.size > 0) {
        this.activeProvider = Array.from(this.providers.keys())[0];
      } else {
        this.activeProvider = null;
      }
    }
  }
  
  /**
   * Set the active provider to use for ticket scanning
   * @param providerName Name of the provider to set as active
   * @returns True if successful, false if provider not found
   */
  setActiveProvider(providerName: string): boolean {
    if (this.providers.has(providerName)) {
      this.activeProvider = providerName;
      return true;
    }
    return false;
  }
  
  /**
   * Get a specific provider by name
   * @param providerName Name of the provider to get
   * @returns Provider instance or null if not found
   */
  getProvider(providerName: string): VisionProvider | null {
    return this.providers.get(providerName) || null;
  }
  
  /**
   * Get the currently active provider
   * @returns Active provider instance or null if none set
   */
  getActiveProvider(): VisionProvider | null {
    if (!this.activeProvider) return null;
    return this.providers.get(this.activeProvider) || null;
  }
  
  /**
   * Get all available provider names
   * @returns Array of provider names
   */
  getAllProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Test all available providers to check their connectivity
   * @returns Map of provider names to connection status
   */
  async testAllProviders(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const isConnected = await provider.testConnection();
        results.set(name, isConnected);
        console.log(`Provider ${name} connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        results.set(name, false);
        console.error(`Error testing provider ${name}:`, error);
      }
    }
    
    return results;
  }
}

// Create singleton instance
const visionProviderRegistry = new VisionProviderRegistry();

export default visionProviderRegistry;
