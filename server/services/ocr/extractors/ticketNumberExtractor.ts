import BaseExtractor from './baseExtractor';

/**
 * Extracts ticket number from OCR text
 */
class TicketNumberExtractor extends BaseExtractor {
  private static instance: TicketNumberExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): TicketNumberExtractor {
    if (!TicketNumberExtractor.instance) {
      TicketNumberExtractor.instance = new TicketNumberExtractor();
    }
    return TicketNumberExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the ticket number
    const candidates = [
      this.extractUsingTicketNumPrefix(cleanedText),
      this.extractUsingCommonTicketFormats(cleanedText),
      this.extractUsingBarcodeContext(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts ticket number by looking for common prefixes
   */
  private extractUsingTicketNumPrefix(text: string): string | null {
    // Common prefixes that might precede ticket numbers
    const ticketPrefixes = [
      'ticket #',
      'ticket no',
      'ticket number',
      'confirmation #',
      'confirmation no',
      'confirmation number',
      'order #',
      'order no',
      'reference #',
      'ref #',
      'ticket:',
      'receipt #'
    ];

    for (const prefix of ticketPrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        // Skip any colons, spaces, etc.
        let adjustedStartIndex = startIndex;
        while (
          adjustedStartIndex < text.length && 
          (text[adjustedStartIndex] === ':' || text[adjustedStartIndex] === ' ' || text[adjustedStartIndex] === '.')
        ) {
          adjustedStartIndex++;
        }
        
        let endIndex = text.indexOf('\n', adjustedStartIndex);
        
        if (endIndex === -1) {
          // If no newline, look for other delimiters
          const possibleDelimiters = [',', '|', '-', ' '];
          
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = text.indexOf(delimiter, adjustedStartIndex + 4); // Skip at least 4 chars for the number
            if (delimiterIndex !== -1 && (endIndex === -1 || delimiterIndex < endIndex)) {
              endIndex = delimiterIndex;
            }
          }
          
          // If still no delimiter found, use a reasonable length
          if (endIndex === -1) {
            endIndex = Math.min(adjustedStartIndex + 20, text.length);
          }
        }
        
        const ticketNumber = text.substring(adjustedStartIndex, endIndex).trim();
        
        // Validate that this looks like a ticket number (usually alphanumeric)
        if (this.isValidTicketNumber(ticketNumber)) {
          return this.cleanText(ticketNumber);
        }
      }
    }

    return null;
  }

  /**
   * Extracts ticket number using common ticket number formats
   */
  private extractUsingCommonTicketFormats(text: string): string | null {
    // Common ticket number formats: 
    // - Alphanumeric sequences (often 6-12 characters)
    // - Number sequences (often 6-12 digits)
    // - Formatted with hyphens (e.g., 123-456-789)
    const ticketFormats = [
      /\b([a-z0-9]{6,12})\b/i,  // Alphanumeric 6-12 chars
      /\b(\d{6,12})\b/,         // Numeric 6-12 digits
      /\b(\d{3,4}-\d{3,4}-\d{3,4})\b/ // Hyphenated format
    ];
    
    const lines = text.split('\n');
    
    // Look for lines that might contain ticket numbers
    for (const line of lines) {
      if (
        line.toLowerCase().includes('ticket') ||
        line.toLowerCase().includes('confirmation') ||
        line.toLowerCase().includes('order') ||
        line.toLowerCase().includes('reference') ||
        line.toLowerCase().includes('transaction')
      ) {
        // Try each format on this line
        for (const format of ticketFormats) {
          const match = line.match(format);
          if (match) {
            return this.cleanText(match[1]);
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Extracts ticket number by looking near barcode mentions
   */
  private extractUsingBarcodeContext(text: string): string | null {
    // Ticket numbers are often printed near barcodes
    const lines = text.split('\n');
    
    // Find lines that mention barcode or QR code
    const barcodeLineIndices = lines.reduce<number[]>((indices, line, index) => {
      if (
        line.toLowerCase().includes('barcode') ||
        line.toLowerCase().includes('bar code') ||
        line.toLowerCase().includes('qr code') ||
        line.toLowerCase().includes('scan')
      ) {
        indices.push(index);
      }
      return indices;
    }, []);
    
    // Look at lines around barcode mentions
    for (const index of barcodeLineIndices) {
      // Check the barcode line itself and 2 lines before and after
      const startIdx = Math.max(0, index - 2);
      const endIdx = Math.min(lines.length - 1, index + 2);
      
      for (let i = startIdx; i <= endIdx; i++) {
        // Look for alphanumeric sequences that look like ticket numbers
        const match = lines[i].match(/\b([a-z0-9]{6,15})\b/i);
        if (match) {
          return this.cleanText(match[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Validates that a string looks like a ticket number
   */
  private isValidTicketNumber(str: string): boolean {
    if (!str || str.trim() === '') return false;
    
    const cleanStr = str.trim();
    
    // Ticket numbers are typically 6-15 characters, and often purely numeric
    // or alphanumeric with possible hyphens
    return (
      /^\d{6,15}$/.test(cleanStr) ||
      /^[a-z0-9]{6,15}$/i.test(cleanStr) ||
      /^[\d-]{8,17}$/.test(cleanStr) // Numbers with possible hyphens
    );
  }
}

export default TicketNumberExtractor.getInstance();
