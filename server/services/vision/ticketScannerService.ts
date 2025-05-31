import visionProviderRegistry from './visionProviderRegistry';
import { VisionApiResponse, TicketData } from './types';
import { MovieTicket } from '../../../shared/schema';
import path from 'path';
import tmdbService from '../tmdb/tmdbService';

interface ScanResult {
  userId: number;
  rawVisionResponse: any;
  ticketImagePath: string;
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

/**
 * AI-powered ticket scanning service using multiple vision API providers
 */
class TicketScannerService {
  private static instance: TicketScannerService;
  
  private constructor() {}
  
  public static getInstance(): TicketScannerService {
    if (!TicketScannerService.instance) {
      TicketScannerService.instance = new TicketScannerService();
    }
    return TicketScannerService.instance;
  }
  
  /**
   * Scan a ticket image and extract information using AI vision APIs
   * @param userId ID of the user who uploaded the ticket
   * @param imagePath Path to the ticket image file
   * @param providerName Optional specific provider to use (uses active provider if not specified)
   * @returns Scan result with extracted ticket data
   */
  async scanTicket(
    userId: number,
    imagePath: string,
    providerName?: string
  ): Promise<ScanResult> {
    try {
      console.log('TicketScanner: Processing image:', imagePath);
      
      // Get vision provider to use
      const provider = providerName
        ? visionProviderRegistry.getProvider(providerName)
        : visionProviderRegistry.getActiveProvider();
      
      if (!provider) {
        throw new Error('No vision provider available for scanning');
      }
      
      console.log(`TicketScanner: Using vision provider: ${provider.name}`);
      
      // Perform the scan
      const result = await provider.extractTicketData(imagePath);
      
      if (!result.success) {
        throw new Error(`Ticket scanning failed: ${result.error}`);
      }
      
      console.log('TicketScanner: Ticket data extracted successfully');
      
      // Validate and enhance the extracted data
      const enhancedData = await this.enhanceTicketData(result.data);
      
      return {
        userId,
        rawVisionResponse: result.rawResponse,
        ticketImagePath: imagePath,
        ...enhancedData
      };
    } catch (error) {
      console.error('TicketScanner: Error scanning ticket:', error);
      throw error;
    }
  }
  
  /**
   * Validate and enhance extracted ticket data
   * @param ticketData Raw ticket data from vision API
   * @returns Enhanced ticket data
   */
  private async enhanceTicketData(ticketData: TicketData): Promise<TicketData> {
    try {
      // Create a copy of the data to enhance
      const enhancedData = { ...ticketData };
      
      // Validate and enhance the movie title if available
      if (enhancedData.movieTitle) {
        try {
          const validatedTitle = await tmdbService.findBestMovieMatch(enhancedData.movieTitle);
          if (validatedTitle) {
            console.log(`TicketScanner: Validated movie title "${enhancedData.movieTitle}" as "${validatedTitle.title}"`);
            enhancedData.movieTitle = validatedTitle.title;
          }
        } catch (error) {
          console.warn('TicketScanner: Could not validate movie title with TMDB:', error.message);
          // Keep the original title if validation fails
        }
      }
      
      // Clean up and validate other fields as needed
      // You can add more field-specific validation and cleaning here
      
      return enhancedData;
    } catch (error) {
      console.error('TicketScanner: Error enhancing ticket data:', error);
      return ticketData; // Return original data if enhancement fails
    }
  }
  
  /**
   * Validates extracted ticket data to ensure it has sufficient information
   * @param ticketData Extracted ticket data
   * @returns If the ticket data is valid
   */
  validateTicketData(ticketData: Partial<MovieTicket>): boolean {
    // At minimum, we require a movie title and at least 3 other fields to consider it valid
    if (!ticketData.movieTitle || ticketData.movieTitle === 'Unknown') {
      return false;
    }
    
    // Count how many other fields are present
    let validFieldCount = 0;
    
    if (ticketData.showTime) validFieldCount++;
    if (ticketData.showDate) validFieldCount++;
    if (ticketData.price) validFieldCount++;
    if (ticketData.seatNumber) validFieldCount++;
    if (ticketData.movieRating) validFieldCount++;
    if (ticketData.theaterRoom) validFieldCount++;
    if (ticketData.ticketNumber) validFieldCount++;
    if (ticketData.theaterName) validFieldCount++;
    if (ticketData.theaterChain) validFieldCount++;
    if (ticketData.ticketType) validFieldCount++;
    
    return validFieldCount >= 3;
  }
  
  /**
   * Check available providers and their status
   * @returns Array of provider status objects
   */
  async getProvidersStatus(): Promise<Array<{name: string, isActive: boolean, isConnected: boolean}>> {
    const activeProvider = visionProviderRegistry.getActiveProvider();
    const providerNames = visionProviderRegistry.getAllProviderNames();
    const connectionResults = await visionProviderRegistry.testAllProviders();
    
    return providerNames.map(name => ({
      name,
      isActive: activeProvider?.name === name,
      isConnected: connectionResults.get(name) || false
    }));
  }
  
  /**
   * Set the active vision provider
   * @param providerName Name of provider to set as active
   * @returns True if successful, false if provider not found
   */
  setActiveProvider(providerName: string): boolean {
    return visionProviderRegistry.setActiveProvider(providerName);
  }
}

export default TicketScannerService.getInstance();
