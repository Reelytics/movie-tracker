import BaseExtractor from './baseExtractor';

/**
 * Extracts show time from OCR text
 */
class ShowTimeExtractor extends BaseExtractor {
  private static instance: ShowTimeExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): ShowTimeExtractor {
    if (!ShowTimeExtractor.instance) {
      ShowTimeExtractor.instance = new ShowTimeExtractor();
    }
    return ShowTimeExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the show time
    const candidates = [
      this.extractUsingTimePrefix(cleanedText),
      this.extractUsingRegex(cleanedText),
      this.extractUsingContextualPositioning(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts show time by looking for common prefixes
   */
  private extractUsingTimePrefix(text: string): string | null {
    // Common prefixes that might precede a show time on a ticket
    const timePrefixes = [
      'time:',
      'showtime:',
      'show time:',
      'starts:',
      'beginning:',
      'starting:'
    ];

    for (const prefix of timePrefixes) {
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
        
        const time = text.substring(startIndex, endIndex).trim();
        
        // Validate that this looks like a time
        if (this.isValidTimeFormat(time)) {
          return this.cleanText(time);
        }
      }
    }

    return null;
  }

  /**
   * Extracts show time using regular expressions to find time patterns
   */
  private extractUsingRegex(text: string): string | null {
    // Common time formats: 7:30PM, 19:30, 7.30 PM, etc.
    const timeRegexPatterns = [
      /\b(1[0-2]|0?[1-9])[:\.](0[0-9]|[1-5][0-9])\s*(am|pm|AM|PM|a\.m\.|p\.m\.)\b/,
      /\b(1[0-2]|0?[1-9])\s*(am|pm|AM|PM|a\.m\.|p\.m\.)\b/,
      /\b([01]?[0-9]|2[0-3])[:\.](0[0-9]|[1-5][0-9])\b/ // 24-hour format
    ];

    for (const pattern of timeRegexPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanText(match[0]);
      }
    }

    return null;
  }

  /**
   * Extracts show time by looking for contextual positioning
   */
  private extractUsingContextualPositioning(text: string): string | null {
    const contextualPhrases = [
      'show', 'screening', 'performance', 'showing', 'start'
    ];
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if the line contains a contextual phrase and also matches our time regex
      if (contextualPhrases.some(phrase => lowerLine.includes(phrase))) {
        // Try to extract a time from this line
        const timeMatch = lowerLine.match(/\b(1[0-2]|0?[1-9])[:\.](0[0-9]|[1-5][0-9])\s*(am|pm|a\.m\.|p\.m\.|\s*h)?\b/i) || 
                          lowerLine.match(/\b([01]?[0-9]|2[0-3])[:\.](0[0-9]|[1-5][0-9])\b/);
        
        if (timeMatch) {
          return this.cleanText(timeMatch[0]);
        }
      }
    }
    
    return null;
  }

  /**
   * Validates if a string looks like a time format
   */
  private isValidTimeFormat(str: string): boolean {
    const cleanStr = str.toLowerCase().trim();
    
    // Check common time formats
    return (
      /^\d{1,2}[:\.]\d{2}\s*(am|pm|a\.m\.|p\.m\.)?$/i.test(cleanStr) ||
      /^\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)$/i.test(cleanStr) ||
      /^\d{1,2}[:\.]\d{2}$/i.test(cleanStr) // 24-hour format
    );
  }
}

export default ShowTimeExtractor.getInstance();
