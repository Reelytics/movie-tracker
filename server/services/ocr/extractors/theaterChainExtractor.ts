import BaseExtractor from './baseExtractor';

/**
 * Extracts theater chain information from OCR text
 */
class TheaterChainExtractor extends BaseExtractor {
  private static instance: TheaterChainExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): TheaterChainExtractor {
    if (!TheaterChainExtractor.instance) {
      TheaterChainExtractor.instance = new TheaterChainExtractor();
    }
    return TheaterChainExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting theater chain
    const candidates = [
      this.extractUsingKnownChains(cleanedText),
      this.extractUsingChainPrefix(cleanedText),
      this.extractFromHeaderText(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts theater chain by looking for known chain names
   */
  private extractUsingKnownChains(text: string): string | null {
    const knownChains = [
      'amc', 'regal', 'cinemark', 'fandango', 'alamo', 'drafthouse',
      'marquee', 'harkins', 'studio', 'showtimes', 'landmark', 'angelika',
      'theatres', 'cinemas', 'multiplex', 'megaplex', 'stubs'
    ];

    // Split text into lines for analysis
    const lines = text.split('\n');
    
    // Check each line for known chains
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Skip lines that are likely headers or footers
      if (this.isHeaderFooterContent(lineLower)) continue;
      
      // Check for exact matches
      for (const chain of knownChains) {
        if (lineLower.includes(chain)) {
          return chain;
        }
      }
      
      // Check for common chain abbreviations
      if (lineLower.includes('amc') && lineLower.includes('theatres')) {
        return 'AMC Theatres';
      }
      if (lineLower.includes('regal') && (lineLower.includes('cinemas') || lineLower.includes('entertainment'))) {
        return 'Regal Cinemas';
      }
      if (lineLower.includes('cinemark') && (lineLower.includes('premium') || lineLower.includes('theatres'))) {
        return 'Cinemark Theatres';
      }
    }
    
    return null;
  }

  /**
   * Extracts theater chain by looking for common prefixes
   */
  private extractUsingChainPrefix(text: string): string | null {
    const chainPrefixes = [
      'chain:', 'theater chain:', 'cinema chain:', 'network:', 'brand:'
    ];

    for (const prefix of chainPrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // Look for other delimiters if no newline
          const possibleDelimiters = [',', '|', '-', '(', 'theater name:', 'location:'];
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = text.indexOf(delimiter, startIndex);
            if (delimiterIndex !== -1 && (endIndex === -1 || delimiterIndex < endIndex)) {
              endIndex = delimiterIndex;
            }
          }
          
          if (endIndex === -1) {
            endIndex = Math.min(startIndex + 30, text.length);
          }
        }
        
        const chain = text.substring(startIndex, endIndex).trim();
        return this.cleanText(chain);
      }
    }

    return null;
  }

  /**
   * Extracts theater chain from header/footer content
   */
  private extractFromHeaderText(text: string): string | null {
    // Look at first 3 lines and last 3 lines for chain information
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headerLines = lines.slice(0, 3);
    const footerLines = lines.slice(-3);
    
    // Check header/footer lines for known patterns
    for (const line of [...headerLines, ...footerLines]) {
      // Skip lines that look like generic headers
      if (this.isHeaderFooterContent(line)) continue;
      
      // Check for known chains in header/footer
      const knownChains = [
        'amc', 'regal', 'cinemark', 'fandango', 'alamos', 'drafthouse',
        'marquee', 'harkins', 'studio', 'showtimes', 'landmark', 'angelika'
      ];
      
      for (const chain of knownChains) {
        if (line.toLowerCase().includes(chain)) {
          return chain;
        }
      }
    }
    
    return null;
  }

  /**
   * Determines if a line is likely a header/footer (not containing actual content)
   */
  private isHeaderFooterContent(line: string): boolean {
    const headerFooterKeywords = [
      'ticket', 'receipt', 'admission', 'cinema', 'theater',
      'welcome', 'thank you', 'enjoy', 'presents', 'admit one',
      'www.', '.com', '.org', 'barcode', 'qr code', 'ticket number',
      'cinema chain', 'theater network', 'location', 'address'
    ];
    
    const lineLower = line.toLowerCase();
    
    return headerFooterKeywords.some(keyword => 
      lineLower.includes(keyword) && lineLower.length < 30
    );
  }
}

export default TheaterChainExtractor;
