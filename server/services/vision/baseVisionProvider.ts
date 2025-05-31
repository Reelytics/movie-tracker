import fs from 'fs';
import { VisionProvider, VisionProviderOptions, VisionApiResponse, TicketData } from './types';

/**
 * Base class for all vision API providers
 */
export abstract class BaseVisionProvider implements VisionProvider {
  public readonly name: string;
  protected apiKey: string;
  protected modelVersion: string;
  protected timeout: number;
  protected maxRetries: number;
  
  constructor(name: string, options: VisionProviderOptions) {
    this.name = name;
    this.apiKey = options.apiKey;
    this.modelVersion = options.modelVersion || 'default';
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.maxRetries = options.maxRetries || 3;
  }
  
  /**
   * Read an image file and convert it to base64
   * @param imagePath Path to the image file
   * @returns Base64 encoded image data
   */
  protected async readImageAsBase64(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.promises.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error(`Error reading image file at ${imagePath}:`, error);
      throw new Error(`Failed to read image file: ${error.message}`);
    }
  }
  
  /**
   * Generate a standard error response
   * @param message Error message
   * @param originalError The original error object
   * @returns Standardized error response
   */
  protected createErrorResponse(message: string, originalError?: any): VisionApiResponse {
    console.error(`[${this.name}] ${message}`, originalError);
    
    return {
      success: false,
      data: this.createEmptyTicketData(),
      error: message + (originalError ? `: ${originalError.message}` : '')
    };
  }
  
  /**
   * Create empty ticket data object with all fields set to null
   * @returns Empty ticket data
   */
  protected createEmptyTicketData(): TicketData {
    return {
      movieTitle: null,
      showTime: null,
      showDate: null,
      price: null,
      seatNumber: null,
      movieRating: null,
      theaterRoom: null,
      ticketNumber: null,
      theaterName: null,
      theaterChain: null,
      ticketType: null
    };
  }
  
  /**
   * Helper function to implement exponential backoff for API retries
   * @param fn The async function to retry
   * @returns Result of the function call
   */
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`[${this.name}] Attempt ${attempt} failed: ${error.message}`);
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * 2 ** attempt, 10000); // Exponential backoff, max 10 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error(`All ${this.maxRetries} attempts failed`);
  }
  
  /**
   * Abstract methods to be implemented by specific providers
   */
  abstract extractTicketData(imagePath: string): Promise<VisionApiResponse>;
  abstract testConnection(): Promise<boolean>;
}
