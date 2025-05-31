import axios from 'axios';
import { BaseVisionProvider } from './baseVisionProvider';
import { VisionProviderOptions, VisionApiResponse, TicketData } from './types';
import fs from 'fs';

/**
 * Microsoft Azure Computer Vision implementation for ticket scanning
 * Note: This uses Azure's GPT-4 Vision capability, not the older OCR APIs
 */
export class AzureVisionProvider extends BaseVisionProvider {
  private readonly endpoint: string;
  private readonly deploymentName: string;
  
  constructor(options: VisionProviderOptions & { endpoint: string, deploymentName?: string }) {
    super('Microsoft Azure Computer Vision', options);
    this.endpoint = options.endpoint;
    this.deploymentName = options.deploymentName || 'gpt-4-vision';
  }
  
  /**
   * Extract ticket data using Azure Computer Vision
   * @param imagePath Path to the ticket image
   * @returns Extracted ticket data and success status
   */
  async extractTicketData(imagePath: string): Promise<VisionApiResponse> {
    try {
      console.log(`[${this.name}] Extracting ticket data from: ${imagePath}`);
      
      // Read image as binary for Azure's API
      const imageBuffer = await fs.promises.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Create URL for the Azure OpenAI GPT-4 Vision endpoint
      const apiUrl = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-12-01-preview`;
      
      // Create the API payload
      const payload = {
        messages: [
          { 
            role: "system", 
            content: this.createSystemPrompt() 
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all available information from this movie ticket image. Return ONLY a valid JSON object with the specified fields."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      };
      
      // Make API request with retry logic
      const response = await this.withRetry(() => 
        axios.post(
          apiUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.apiKey
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
      return this.createErrorResponse('Failed to extract ticket data with Azure Vision', error);
    }
  }
  
  /**
   * Test the API connection and authentication
   * @returns True if successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Create URL for the Azure OpenAI endpoint
      const apiUrl = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-12-01-preview`;
      
      const response = await axios.post(
        apiUrl,
        {
          messages: [
            {
              role: "user",
              content: "Testing API connection. Please respond with 'Connection successful'."
            }
          ],
          max_tokens: 20
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
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
    const assistantMessage = apiResponse.choices?.[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No content found in Azure response');
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
