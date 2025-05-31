import axios from 'axios';
import { BaseVisionProvider } from './baseVisionProvider';
import { VisionProviderOptions, VisionApiResponse } from './types';

/**
 * Anthropic Claude Vision implementation for ticket scanning
 */
export class AnthropicVisionProvider extends BaseVisionProvider {
  private readonly apiEndpoint: string;
  
  constructor(options: VisionProviderOptions) {
    super('Anthropic Claude Vision', options);
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    this.modelVersion = options.modelVersion || 'claude-3-opus-20240229';
  }
  
  /**
   * Extract ticket data using Anthropic Claude Vision
   * @param imagePath Path to the ticket image
   * @returns Extracted ticket data and success status
   */
  async extractTicketData(imagePath: string): Promise<VisionApiResponse> {
    try {
      console.log(`[${this.name}] Extracting ticket data from: ${imagePath}`);
      
      // Read image as base64
      const base64Image = await this.readImageAsBase64(imagePath);
      
      // Create the API payload
      const payload = {
        model: this.modelVersion,
        max_tokens: 1000,
        system: this.createSystemPrompt(),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all available information from this movie ticket image. Return ONLY a valid JSON object with the specified fields."
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };
      
      // Make API request with retry logic
      const response = await this.withRetry(() => 
        axios.post(
          this.apiEndpoint,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01'
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
      return this.createErrorResponse('Failed to extract ticket data with Anthropic Claude Vision', error);
    }
  }
  
  /**
   * Test the API connection and authentication
   * @returns True if successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: this.modelVersion,
          max_tokens: 20,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Testing API connection. Please respond with 'Connection successful'."
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000 // Shorter timeout for test
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error(`[${this.name}] Test connection failed:`, error.message);
      return false;
    }
  }
  
  /**
   * Create the system prompt for the API
   * @returns System prompt string
   */
  private createSystemPrompt(): string {
    return `You are a specialized movie ticket information extractor. 
Your task is to analyze the image of a movie ticket and extract the following specific information in JSON format:
- movieTitle: The title of the movie (Ex. "Wonka")
- showTime: The time of the movie showing (Ex. "6:45pm")
- showDate: The date of the movie showing (Ex. "Mon 01/15/2024")
- price: The ticket price (Ex. "$14.99")
- seatNumber: The seat assignment (Ex. "L6")
- movieRating: The MPAA rating of the movie (Ex. "PG" or "PG-13" or "R")
- theaterRoom: The specific theater/auditorium number (Ex. "Theater 4")
- ticketNumber: The unique ticket identifier (Ex. "270410133")
- theaterName: The specific location name (Ex. "Assembly Row")
- theaterChain: The theater company name (Ex. "AMC" or "Regal")
- ticketType: The type of ticket (Ex. "Adult", "Child", "Senior", "Student", "Military")

For each field, return the exact text as it appears on the ticket. If you cannot find specific information, use null for that field. Do not make assumptions or provide placeholder values.

Respond ONLY with a valid JSON object containing these fields and nothing else. Do not include any explanations or notes outside the JSON.`;
  }
  
  /**
   * Parse the API response to extract ticket data
   * @param apiResponse The raw API response
   * @returns Structured ticket data
   */
  private parseApiResponse(apiResponse: any): any {
    const assistantMessage = apiResponse.content[0]?.text;
    
    if (!assistantMessage) {
      throw new Error('No content found in Anthropic response');
    }
    
    try {
      // Extract JSON from the response (handling potential text wrapper)
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : assistantMessage;
      
      // Parse the JSON and ensure it has the expected structure
      const ticketData = JSON.parse(jsonStr);
      
      // Ensure all expected fields exist (use null for missing ones)
      const emptyData = this.createEmptyTicketData();
      return { ...emptyData, ...ticketData };
    } catch (error) {
      console.error(`[${this.name}] Error parsing response:`, error);
      throw new Error(`Failed to parse API response: ${error.message}`);
    }
  }
}
