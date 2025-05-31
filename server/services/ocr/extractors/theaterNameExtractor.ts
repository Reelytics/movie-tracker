import BaseExtractor from './baseExtractor';
import TheaterChainExtractor from './theaterChainExtractor';

/**
 * Extracts theater name from OCR text
 */
class TheaterNameExtractor extends BaseExtractor {
  private static instance: TheaterNameExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): TheaterNameExtractor {
    if (!TheaterNameExtractor.instance) {
      TheaterNameExtractor.instance = new TheaterNameExtractor();
    }
    return TheaterNameExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting theater name
    const candidates = [
      this.extractUsingKnownPatterns(cleanedText),
      this.extractUsingLocationPrefix(cleanedText),
      this.extractUsingChainContext(cleanedText),
      this.extractFromHeaderText(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts theater name using known theater name patterns
   */
  private extractUsingKnownPatterns(text: string): string | null {
    const knownTheaters = [
      'amc empire', 'amc loews', 'amc classic', 'regal union square', 'cinemark palace',
      'amc theaters', 'regal cinemas', 'cinemark theatres', 'studio movie grill',
      'harkins premium', 'landmark theaters', 'angelika film center', 'alamo draft house',
      'marquee cinemas', 'showtimes theaters', 'megaplex cinemas', 'stubs theaters'
    ];

    const lines = text.split('\n');
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Skip lines that are likely headers or footers
      if (this.isHeaderFooterContent(lineLower)) continue;
      
      // Check for exact matches
      for (const theater of knownTheaters) {
        if (lineLower.includes(theater)) {
          return theater;
        }
      }
      
      // Check for common theater name patterns
      if (lineLower.includes('theater') && lineLower.length < 50) {
        return lineLower.replace('theater', '').trim();
      }
      if (lineLower.includes('cinema') && lineLower.length < 50) {
        return lineLower.replace('cinema', '').trim();
      }
    }
    
    return null;
  }

  /**
   * Extracts theater name by looking for location prefixes
   */
  private extractUsingLocationPrefix(text: string): string | null {
    const locationPrefixes = [
      'location:', 'theater name:', 'cinema name:', 'venue:', 'theater:'
    ];

    for (const prefix of locationPrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // Look for other delimiters if no newline
          const possibleDelimiters = [',', '|', '-', '(', 'show time:', 'date:'];
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = text.indexOf(delimiter, startIndex);
            if (delimiterIndex !== -1 && (endIndex === -1 || delimiterIndex < endIndex)) {
              endIndex = delimiterIndex;
            }
          }
          
          if (endIndex === -1) {
            endIndex = Math.min(startIndex + 50, text.length);
          }
        }
        
        const theater = text.substring(startIndex, endIndex).trim();
        return this.cleanText(theater);
      }
    }

    return null;
  }

  /**
   * Extracts theater name using context from theater chain extractor
   */
  private extractUsingChainContext(text: string): string | null {
    // Get chain information first to help identify theater names
    const chainExtractor = TheaterChainExtractor.getInstance();
    const theaterChain = chainExtractor.extract(text);
    
    if (!theaterChain) return null;
    
    // Common theater names associated with specific chains
    // Common theater names associated with specific chains
    const chainTheaterPatterns: { [key: string]: string[] } = {
      'amc': ['empire', 'loews', 'classic', 'dine', 'megaplex', 'studio', 'marquee'],
      'regal': ['union square', 'royal', 'south beach', 'greenacres', 'delray', 'palm beach'],
      'cinemark': ['palace', 'premiere', 'grand', 'plaza', 'prime', 'delray', 'boca'],
      'alamo': ['drafthouse', 'atx', 'village', 'silo', 'ritz', 'cary', 'dallas'],
      'landmark': ['nu art', 'westwood', 'courthouse', 'shelby', 'columbia', 'harvard'],
      'angelika': ['film center', 'ny', 'dallas', 'houston', 'philly', 'atlanta'],
      'showtimes': ['asbury', 'jersey', 'new york', 'los angeles', 'chicago', 'seattle'],
      'harkins': ['premium', 'superstar', 'christie', 'dine', 'deluxe', 'platinum'],
      'studio': ['movie grill', 'cinema', 'theater', 'screen', 'showcase', 'deluxe']
    };
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Skip lines that are likely headers or footers
      if (this.isHeaderFooterContent(lineLower)) continue;
      
      // Check for patterns associated with known chains
      if (theaterChain && chainTheaterPatterns[theaterChain]) {
        for (const pattern of chainTheaterPatterns[theaterChain] || []) {
          if (lineLower.includes(pattern)) {
            return `${theaterChain} ${pattern}`;
          }
        }
      }
      
      // Check for generic theater patterns
      if (lineLower.includes('theater') && lineLower.length < 50) {
        return lineLower.replace('theater', '').trim();
      }
      if (lineLower.includes('cinema') && lineLower.length < 50) {
        return lineLower.replace('cinema', '').trim();
      }
    }
    
    return null;
  }

  /**
   * Extracts theater name from header/footer content
   */
  private extractFromHeaderText(text: string): string | null {
    // Look at first 3 lines and last 3 lines for theater information
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headerLines = lines.slice(0, 3);
    const footerLines = lines.slice(-3);
    
    // Common theater name patterns in headers/footers
    const theaterPatterns = [
      'amc', 'regal', 'cinemark', 'fandango', 'alamos', 'drafthouse',
      'marquee', 'harkins', 'studio', 'showtimes', 'landmark', 'angelika'
    ];
    
    // Check header/footer lines for theater names
    for (const line of [...headerLines, ...footerLines]) {
      // Skip lines that look like generic headers
      if (this.isHeaderFooterContent(line)) continue;
      
      // Check for patterns in the line
      for (const pattern of theaterPatterns) {
        if (line.toLowerCase().includes(pattern)) {
          const match = line.match(new RegExp(`\\b${pattern}.*?\\b`, 'i'));
          if (match) {
            return this.cleanText(match[0]);
          }
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

export default TheaterNameExtractor.getInstance();
