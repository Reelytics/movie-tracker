import ocrService, { OcrService } from './ocrService';
import movieTitleExtractor from './extractors/movieTitleExtractor';
import showTimeExtractor from './extractors/showTimeExtractor';
import showDateExtractor from './extractors/showDateExtractor';
import priceExtractor from './extractors/priceExtractor';
import seatNumberExtractor from './extractors/seatNumberExtractor';
import movieRatingExtractor from './extractors/movieRatingExtractor';
import theaterRoomExtractor from './extractors/theaterRoomExtractor';
import ticketNumberExtractor from './extractors/ticketNumberExtractor';
import theaterNameExtractor from './extractors/theaterNameExtractor';

interface ScanResult {
  userId: number;
  rawOcrText: string;
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
}

class TicketScannerService {
  private static instance: TicketScannerService;
  private ocrService: OcrService;

  private constructor() {
    this.ocrService = ocrService;
  }

  public static getInstance(): TicketScannerService {
    if (!TicketScannerService.instance) {
      TicketScannerService.instance = new TicketScannerService();
    }
    return TicketScannerService.instance;
  }

  /**
   * Scan a ticket image and extract information
   */
  async scanTicket(userId: number, imagePath: string): Promise<ScanResult> {
    try {
      console.log('TicketScanner: Processing image:', imagePath);

      // Get OCR service instance (ocrService is already the singleton instance)
      const ocrInstance = this.ocrService;

      // Preprocess the image
      const processedImagePath = await ocrInstance.preprocessImage(imagePath);
      console.log('TicketScanner: Image preprocessed:', processedImagePath);

      // Perform OCR
      const ocrText = await ocrInstance.performOcr(processedImagePath);
      console.log('TicketScanner: OCR completed');

      // Verify it's a movie ticket
      if (!ocrInstance.isMovieTicket(ocrText)) {
        throw new Error('Image does not appear to be a movie ticket');
      }

      // Extract information using various extractors
      const [
        movieTitle,
        showTime,
        showDate,
        price,
        seatNumber,
        movieRating,
        theaterRoom,
        ticketNumber,
        theaterName
      ] = await Promise.all([
        movieTitleExtractor.extract(ocrText),
        showTimeExtractor.extract(ocrText),
        showDateExtractor.extract(ocrText),
        priceExtractor.extract(ocrText),
        seatNumberExtractor.extract(ocrText),
        movieRatingExtractor.extract(ocrText),
        theaterRoomExtractor.extract(ocrText),
        ticketNumberExtractor.extract(ocrText),
        theaterNameExtractor.extract(ocrText)
      ]);

      return {
        userId,
        rawOcrText: ocrText,
        ticketImagePath: imagePath,
        movieTitle,
        showTime,
        showDate,
        price,
        seatNumber,
        movieRating,
        theaterRoom,
        ticketNumber,
        theaterName
      };
    } catch (error) {
      console.error('TicketScanner: Error scanning ticket:', error);
      throw error;
    }
  }
}

export default TicketScannerService.getInstance(); 