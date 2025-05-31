import BaseExtractor from './baseExtractor';

/**
 * Extracts ticket price from OCR text
 */
class PriceExtractor extends BaseExtractor {
  private static instance: PriceExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): PriceExtractor {
    if (!PriceExtractor.instance) {
      PriceExtractor.instance = new PriceExtractor();
    }
    return PriceExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the price
    const candidates = [
      this.extractUsingPricePrefix(cleanedText),
      this.extractUsingCurrencySymbol(cleanedText),
      this.extractUsingPriceContext(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts price by looking for common prefixes
   */
  private extractUsingPricePrefix(text: string): string | null {
    // Common prefixes that might precede a price on a ticket
    const pricePrefixes = [
      'price:',
      'total:',
      'amount:',
      'cost:',
      'paid:',
      'ticket price:'
    ];

    for (const prefix of pricePrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // If no newline, look for other delimiters
          const possibleDelimiters = [',', '|', '-'];
          
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
        
        const price = text.substring(startIndex, endIndex).trim();
        
        if (this.isValidPriceFormat(price)) {
          return this.cleanText(price);
        }
      }
    }

    return null;
  }

  /**
   * Extracts price by looking for currency symbols ($, €, £, ¥, etc.)
   */
  private extractUsingCurrencySymbol(text: string): string | null {
    // Look for currency symbols followed by numbers
    const currencyPattern = /(?:[$€£¥]\s*\d+(?:\.\d{2})?)|(?:\d+(?:\.\d{2})?\s*[$€£¥])/g;
    
    const matches = text.match(currencyPattern);
    if (matches && matches.length > 0) {
      // If multiple matches, find the one most likely to be the ticket price
      // (Generally prices ending in .00, .50, .99 are more likely)
      for (const match of matches) {
        if (/\.\d{2}/.test(match)) {
          return this.cleanText(match);
        }
      }
      
      // If no price with cents found, return the first match
      return this.cleanText(matches[0]);
    }
    
    return null;
  }

  /**
   * Extracts price by looking for contextual clues
   */
  private extractUsingPriceContext(text: string): string | null {
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Look for lines with price-related keywords
      if (
        lowerLine.includes('ticket') || 
        lowerLine.includes('admission') || 
        lowerLine.includes('total') ||
        lowerLine.includes('amount') ||
        lowerLine.includes('payment')
      ) {
        // Try to find a price pattern in this line
        const priceMatch = lowerLine.match(/\d+\.\d{2}/) || // e.g., 12.99
                          lowerLine.match(/\$\s*\d+(?:\.\d{2})?/); // e.g., $ 12.99
        
        if (priceMatch) {
          return this.cleanText(priceMatch[0]);
        }
      }
    }
    
    return null;
  }

  /**
   * Validates if a string looks like a price format
   */
  private isValidPriceFormat(str: string): boolean {
    const cleanStr = str.trim();
    
    // Check common price formats
    return (
      /^[$€£¥]\s*\d+(?:\.\d{2})?$/.test(cleanStr) || // $12.99
      /^\d+(?:\.\d{2})?\s*[$€£¥]$/.test(cleanStr) || // 12.99$
      /^\d+\.\d{2}$/.test(cleanStr) // Just 12.99
    );
  }
}

export default PriceExtractor.getInstance();
