import axios from 'axios';
import { BaseVisionProvider } from './baseVisionProvider';
import { VisionProviderOptions, VisionApiResponse } from './types';

/**
 * Google Gemini Vision implementation for ticket scanning
 */
export class GeminiVisionProvider extends BaseVisionProvider {
  private readonly apiEndpoint: string;
  
  constructor(options: VisionProviderOptions) {
    super('Google Gemini Vision', options);
    // Use the model version from environment variables or use gemini-1.5-flash as default
    this.modelVersion = options.modelVersion || process.env.GEMINI_MODEL_VERSION || 'gemini-1.5-flash';
    this.apiEndpoint = `https://generativelanguage.googleapis.com/v1/models/${this.modelVersion}:generateContent`;
  }
  
  /**
   * Extract ticket data using Google Gemini Vision
   * @param imagePath Path to the ticket image
   * @returns Extracted ticket data and success status
   */
  async extractTicketData(imagePath: string): Promise<VisionApiResponse> {
    try {
      console.log(`[${this.name}] Extracting ticket data from: ${imagePath}`);
      
      // Read image as base64
      const base64Image = await this.readImageAsBase64(imagePath);
      
      // Prepare the request payload
      const payload = {
        contents: [
          {
            parts: [
              {
                text: this.createPrompt()
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
      
      // Make API request with retry logic
      const response = await this.withRetry(() => 
        axios.post(
          `${this.apiEndpoint}?key=${this.apiKey}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: this.timeout
          }
        )
      );
      
      console.log(`[${this.name}] API response received`);
      
      // Parse the response to extract ticket data
      const ticketData = this.parseApiResponse(response.data);
      
      return {
        success: true,
        data: ticketData,
        rawResponse: response.data
      };
    } catch (error) {
      return this.createErrorResponse('Failed to extract ticket data with Google Gemini Vision', error);
    }
  }
  
  /**
   * Test the API connection and authentication
   * @returns True if successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use the models listing endpoint to check if API key is valid
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Shorter timeout for test
        }
      );
      
      return response.status === 200;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${this.name}] Test connection failed:`, errorMessage);
      return false;
    }
  }
  
  /**
   * Create the prompt for the API
   * @returns Prompt string
   */
  private createPrompt(): string {
    // Enhanced prompt for better extraction
    return `You are a specialized movie ticket information extraction system. 
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

Pay special attention to look for key information areas on the ticket, and be very precise about extracting the movie title exactly as it appears, as this is the most critical field.`;
  }
  
  /**
   * Parse the API response to extract ticket data
   * @param apiResponse The raw API response
   * @returns Structured ticket data
   */
  private parseApiResponse(apiResponse: any): any {
    const content = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content found in Google Gemini response');
    }
    
    try {
      // Try to extract JSON directly
      let ticketData: any = null;
      
      try {
        // First attempt: Try to parse the whole response as JSON
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
      
      // Log the extracted data for debugging
      console.log(`[${this.name}] Extracted ticket data:`, JSON.stringify(ticketData, null, 2));
      
      // Ensure all expected fields exist (use null for missing ones)
      const emptyData = this.createEmptyTicketData();
      return { ...emptyData, ...ticketData };
    } catch (error) {
      console.error(`[${this.name}] Error parsing response:`, error);
      console.error(`[${this.name}] Raw content:`, content);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse API response: ${errorMessage}`);
    }
  }
}
