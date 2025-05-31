import { MovieTicket } from '../../../shared/schema';
import ocrService from './ocrService';
import movieTitleExtractor from './extractors/movieTitleExtractor';
import showTimeExtractor from './extractors/showTimeExtractor';
import dateExtractor from './extractors/dateExtractor';
import priceExtractor from './extractors/priceExtractor';
import seatExtractor from './extractors/seatExtractor';
import movieRatingExtractor from './extractors/movieRatingExtractor';
import theaterRoomExtractor from './extractors/theaterRoomExtractor';
import ticketNumberExtractor from './extractors/ticketNumberExtractor';
import theaterNameExtractor from './extractors/theaterNameExtractor';

/**
 * Service to parse movie tickets from images
 */
class TicketParser {
  private static instance: TicketParser;

  private constructor() {}

  public static getInstance(): TicketParser {
    if (!TicketParser.instance) {
      TicketParser.instance = new TicketParser();
    }
    return TicketParser.instance;
  }

  /**
   * Processes an image to extract movie ticket information
   * @param imagePath - Path to the ticket image
   * @param userId - ID of the user who uploaded the ticket
   * @returns Parsed ticket data
   */
  async parseTicket(imagePath: string, userId: number): Promise<Partial<MovieTicket> | null> {
    try {
      // Step 1: Preprocess image to improve OCR quality
      const preprocessedImagePath = await ocrService.preprocessImage(imagePath);
      
      // Step 2: Perform OCR on the preprocessed image
      const ocrText = await ocrService.performOcr(preprocessedImagePath);
      
      // Step 3: Determine if this is actually a movie ticket
      if (!ocrService.isMovieTicket(ocrText)) {
        console.log('The scanned image does not appear to be a movie ticket');
        return null;
      }
      
      // Step 4: Extract all data points from the OCR text
      const ticketData: Partial<MovieTicket> = {
        userId,
        rawOcrText: ocrText,
        ticketImagePath: imagePath,
        // Extract data using specialized extractors
        movieTitle: movieTitleExtractor.extract(ocrText) || 'Unknown Movie',
        showTime: showTimeExtractor.extract(ocrText),
        showDate: dateExtractor.extract(ocrText),
        price: priceExtractor.extract(ocrText),
        seatNumber: seatExtractor.extract(ocrText),
        movieRating: movieRatingExtractor.extract(ocrText),
        theaterRoom: theaterRoomExtractor.extract(ocrText),
        ticketNumber: ticketNumberExtractor.extract(ocrText),
        theaterName: theaterNameExtractor.extract(ocrText)
      };
      
      console.log('Extracted ticket data:', ticketData);
      
      return ticketData;
    } catch (error) {
      console.error('Error parsing movie ticket:', error);
      throw new Error(`Ticket parsing failed: ${error.message}`);
    }
  }

  /**
   * Validates extracted ticket data
   * @param ticketData - Parsed ticket data
   * @returns If the ticket data is valid
   */
  validateTicketData(ticketData: Partial<MovieTicket>): boolean {
    // At minimum, we require a movie title and at least 3 other fields to consider it valid
    if (!ticketData.movieTitle || ticketData.movieTitle === 'Unknown Movie') {
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
    
    return validFieldCount >= 3;
  }
}

export default TicketParser.getInstance();
