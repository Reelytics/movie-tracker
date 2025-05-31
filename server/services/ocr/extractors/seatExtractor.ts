import BaseExtractor from './baseExtractor';

/**
 * Extracts seat information from OCR text
 */
class SeatExtractor extends BaseExtractor {
  private static instance: SeatExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): SeatExtractor {
    if (!SeatExtractor.instance) {
      SeatExtractor.instance = new SeatExtractor();
    }
    return SeatExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the seat information
    const candidates = [
      this.extractUsingSeatPrefix(cleanedText),
      this.extractUsingRowSeatPattern(cleanedText),
      this.extractUsingCommonSeatFormats(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts seat by looking for common prefixes
   */
  private extractUsingSeatPrefix(text: string): string | null {
    // Common prefixes that might precede seat information on a ticket
    const seatPrefixes = [
      'seat:',
      'seat #:',
      'seat no:',
      'seat number:',
      'seating:'
    ];

    for (const prefix of seatPrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // If no newline, look for other delimiters
          const possibleDelimiters = [',', '|', '-', 'row:', 'section:'];
          
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = text.indexOf(delimiter, startIndex);
            if (delimiterIndex !== -1 && (endIndex === -1 || delimiterIndex < endIndex)) {
              endIndex = delimiterIndex;
            }
          }
          
          // If still no delimiter found, use a reasonable length
          if (endIndex === -1) {
            endIndex = Math.min(startIndex + 10, text.length);
          }
        }
        
        const seat = text.substring(startIndex, endIndex).trim();
        return this.cleanText(seat);
      }
    }

    return null;
  }

  /**
   * Extracts seat using common row and seat pattern notation
   */
  private extractUsingRowSeatPattern(text: string): string | null {
    // Look for row and seat patterns like "Row A, Seat 12" or "A-12"
    const rowSeatPatterns = [
      /row\s+([a-z0-9]+)[,\s]+seat\s+([a-z0-9]+)/i,
      /row[:\s]+([a-z0-9]+)[,\s]+([a-z0-9]+)/i,
      /([a-z]+)[:\-\s]+([0-9]+)/i, // e.g., "A-12" or "A: 12"
    ];

    for (const pattern of rowSeatPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Format as "Row X, Seat Y" or if simple format just "X-Y"
        if (match[0].toLowerCase().includes('row')) {
          return `Row ${match[1].toUpperCase()}, Seat ${match[2]}`;
        } else {
          return `${match[1].toUpperCase()}-${match[2]}`;
        }
      }
    }

    return null;
  }

  /**
   * Extracts seat using common seat format patterns
   */
  private extractUsingCommonSeatFormats(text: string): string | null {
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Look for lines with seat-related keywords
      if (
        lowerLine.includes('seat') || 
        lowerLine.includes('row') || 
        lowerLine.includes('section')
      ) {
        // Try to extract identifiable seat patterns
        // Common formats: A12, 12A, Row A-12, etc.
        
        // Format: Letter followed by number (A12)
        const pattern1 = /\b([a-z])[- ]?(\d{1,3})\b/i;
        
        // Format: Number followed by letter (12A)
        const pattern2 = /\b(\d{1,3})[- ]?([a-z])\b/i;
        
        // Try the first pattern
        const match1 = lowerLine.match(pattern1);
        if (match1) {
          return `${match1[1].toUpperCase()}-${match1[2]}`;
        }
        
        // Try the second pattern
        const match2 = lowerLine.match(pattern2);
        if (match2) {
          return `${match2[1]}-${match2[2].toUpperCase()}`;
        }
      }
    }
    
    return null;
  }
}

export default SeatExtractor.getInstance();
