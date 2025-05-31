export interface TicketData {
  movieTitle: string | null;
  showTime: string | null;
  showDate: string | null;
  price: string | null;
  seatNumber: string | null;
  movieRating: string | null;
  theaterRoom: string | null;
  ticketNumber: string | null;
  theaterName: string | null;
  theaterChain: string | null;
  ticketType: string | null;
}

export interface VisionProviderOptions {
  apiKey: string;
  modelVersion?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface VisionApiResponse {
  success: boolean;
  data: TicketData;
  rawResponse?: any;
  error?: string;
}

export interface VisionProvider {
  name: string;
  
  /**
   * Extracts ticket information from an image
   * @param imagePath Path to image file
   * @returns Extracted ticket data and success status
   */
  extractTicketData(imagePath: string): Promise<VisionApiResponse>;
  
  /**
   * Tests the API connection and authentication
   * @returns True if successful, false otherwise
   */
  testConnection(): Promise<boolean>;
}
