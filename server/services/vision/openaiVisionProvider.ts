import axios from 'axios';
import { BaseVisionProvider } from './baseVisionProvider';
import { VisionProviderOptions, VisionApiResponse } from './types';

/**
 * OpenAI GPT-4 Vision implementation for ticket scanning
 */
export class OpenAIVisionProvider extends BaseVisionProvider {
  private readonly apiEndpoint: string;
  
  constructor(options: VisionProviderOptions) {
    super('OpenAI GPT-4 Vision', options);
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.modelVersion = options.modelVersion || 'gpt-4-turbo';
  }
  
  /**
   * Extract ticket data using OpenAI GPT-4 Vision
   * @param imagePath Path to the ticket image
   * @returns Extracted ticket data and success status
   */
  async extractTicketData(imagePath: string): Promise<VisionApiResponse> {
    try {
      console.log(`[${this.name}] Extracting ticket data from: ${imagePath}`);
      
      // Read image as base64
      const base64Image = await this.readImageAsBase64(imagePath);
      
      // Prepare the prompt with detailed instructions
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(base64Image);
      
      // Make API request with retry logic
      const response = await this.withRetry(() => 
        axios.post(
          this.apiEndpoint,
          {
            model: this.modelVersion,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 1000,
            temperature: 0
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
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
      return this.createErrorResponse('Failed to extract ticket data with OpenAI Vision', error);
    }
  }
  
  /**
   * Test the API connection and authentication
   * @returns True if successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use models list endpoint for a lighter authentication test
      const response = await axios.get(
        'https://api.openai.com/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
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
   * Create the system prompt for the API
   * @returns System prompt string
   */
  private createSystemPrompt(): string {
    return `You are a specialized movie ticket information extraction system.
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

Your ENTIRE response must be ONLY the JSON object. Do not include any other text whatsoever.`;
  }
  
  /**
   * Create the user prompt with the image
   * @param base64Image Base64 encoded image data
   * @returns User prompt array with image
   */
  private createUserPrompt(base64Image: string): any[] {
    return [
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
    ];
  }
  
  /**
   * Parse the API response to extract ticket data
   * @param apiResponse The raw API response
   * @returns Structured ticket data
   */
  private parseApiResponse(apiResponse: any): any {
    const assistantMessage = apiResponse.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No content found in OpenAI response');
    }
    
    try {
      // Try to extract JSON directly
      let ticketData: any = null;
      
      try {
        // First attempt: Try to parse the whole response as JSON
        ticketData = JSON.parse(assistantMessage);
      } catch (e) {
        // Second attempt: Try to extract JSON from text
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          ticketData = JSON.parse(jsonStr);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
      
      // Ensure all expected fields exist (use null for missing ones)
      const emptyData = this.createEmptyTicketData();
      return { ...emptyData, ...ticketData };
    } catch (error) {
      console.error(`[${this.name}] Error parsing response:`, error);
      console.error(`[${this.name}] Raw content:`, assistantMessage);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse API response: ${errorMessage}`);
    }
  }
}
