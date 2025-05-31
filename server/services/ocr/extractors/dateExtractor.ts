import BaseExtractor from './baseExtractor';

/**
 * Extracts show date from OCR text
 */
class DateExtractor extends BaseExtractor {
  private static instance: DateExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): DateExtractor {
    if (!DateExtractor.instance) {
      DateExtractor.instance = new DateExtractor();
    }
    return DateExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the date
    const candidates = [
      this.extractUsingDatePrefix(cleanedText),
      this.extractUsingRegex(cleanedText),
      this.extractUsingDayOfWeek(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts date by looking for common prefixes
   */
  private extractUsingDatePrefix(text: string): string | null {
    // Common prefixes that might precede a date on a ticket
    const datePrefixes = [
      'date:',
      'show date:',
      'screening date:',
      'performance date:',
      'showing on:'
    ];

    for (const prefix of datePrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // If no newline, look for other delimiters
          const possibleDelimiters = [',', '|', '-', 'time:'];
          
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = text.indexOf(delimiter, startIndex);
            if (delimiterIndex !== -1 && (endIndex === -1 || delimiterIndex < endIndex)) {
              endIndex = delimiterIndex;
            }
          }
          
          // If still no delimiter found, use a reasonable length
          if (endIndex === -1) {
            endIndex = Math.min(startIndex + 15, text.length);
          }
        }
        
        const date = text.substring(startIndex, endIndex).trim();
        
        if (this.isValidDateFormat(date)) {
          return this.cleanText(date);
        }
      }
    }

    return null;
  }

  /**
   * Extracts date using regular expressions to find date patterns
   */
  private extractUsingRegex(text: string): string | null {
    // Various date formats MM/DD/YYYY, DD/MM/YYYY, Month DD, YYYY, etc.
    const dateRegexPatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](20\d{2}|\d{2})\b/,
      
      // DD/MM/YYYY or DD-MM-YYYY
      /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/,
      
      // Month DD, YYYY
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s*(20\d{2})?\b/i,
      
      // DD Month YYYY
      /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*(20\d{2})?\b/i
    ];

    for (const pattern of dateRegexPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanText(match[0]);
      }
    }

    return null;
  }

  /**
   * Extracts date by looking for day of the week followed by a date
   */
  private extractUsingDayOfWeek(text: string): string | null {
    const dayOfWeekPattern = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*(20\d{2})?\b/i;
    
    const match = text.match(dayOfWeekPattern);
    if (match) {
      return this.cleanText(match[0]);
    }
    
    // Also look for standalone dates near day of week
    const dayOfWeekLines = text.split('\n').filter(line => 
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i.test(line)
    );
    
    for (const line of dayOfWeekLines) {
      // Look for date formats in the same line
      const dateMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})\b/) || 
                       line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(0?[1-9]|[12]\d|3[01])\b/i);
      
      if (dateMatch) {
        return this.cleanText(dateMatch[0]);
      }
    }
    
    return null;
  }

  /**
   * Validates if a string looks like a date format
   */
  private isValidDateFormat(str: string): boolean {
    const cleanStr = str.toLowerCase().trim();
    
    // Check common date formats
    return (
      // MM/DD/YYYY or similar
      /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(cleanStr) ||
      
      // Month names
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?(\s*,?\s*\d{4})?$/i.test(cleanStr) ||
      
      // DD Month YYYY
      /^\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*\d{4}?$/i.test(cleanStr) ||
      
      // Day of week + date
      /^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*\d{4}?$/i.test(cleanStr)
    );
  }
}

export default DateExtractor.getInstance();
