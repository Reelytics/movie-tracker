import BaseExtractor from './baseExtractor';

/**
 * Extracts theater room information from OCR text
 */
class TheaterRoomExtractor extends BaseExtractor {
  private static instance: TheaterRoomExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): TheaterRoomExtractor {
    if (!TheaterRoomExtractor.instance) {
      TheaterRoomExtractor.instance = new TheaterRoomExtractor();
    }
    return TheaterRoomExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the theater room
    const candidates = [
      this.extractUsingRoomPrefix(cleanedText),
      this.extractUsingAuditoriumPattern(cleanedText),
      this.extractUsingContextualClues(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts theater room by looking for common prefixes
   */
  private extractUsingRoomPrefix(text: string): string | null {
    // Common prefixes that might precede theater room information on a ticket
    const roomPrefixes = [
      'room:',
      'theater:',
      'theatre:',
      'auditorium:',
      'cinema:',
      'screen:'
    ];

    for (const prefix of roomPrefixes) {
      if (text.includes(prefix)) {
        const startIndex = text.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          // If no newline, look for other delimiters
          const possibleDelimiters = [',', '|', '-', 'seat:', 'time:'];
          
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
        
        const roomText = text.substring(startIndex, endIndex).trim();
        
        // Clean up and validate
        if (roomText && roomText.length > 0 && roomText.length < 20) {
          return this.cleanText(roomText);
        }
      }
    }

    return null;
  }

  /**
   * Extracts theater room using common auditorium/screen patterns
   */
  private extractUsingAuditoriumPattern(text: string): string | null {
    // Common patterns for auditorium/screen/theater numbers
    const auditoriumPatterns = [
      /\bscr(?:een)?\s*#?\s*(\d+[a-z]?)\b/i,
      /\baud(?:itorium)?\s*#?\s*(\d+[a-z]?)\b/i,
      /\btheat(?:er|re)?\s*#?\s*(\d+[a-z]?)\b/i,
      /\broom\s*#?\s*(\d+[a-z]?)\b/i,
      /\b(?:theater|theatre|auditorium|screen|room)\s*([a-z])\b/i // Letter rooms like "Theater A"
    ];

    for (const pattern of auditoriumPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Format based on type of match
        if (/^\d+$/.test(match[1])) {
          return `Theater ${match[1]}`;
        } else if (/^[a-z]$/i.test(match[1])) {
          return `Theater ${match[1].toUpperCase()}`;
        } else {
          return this.cleanText(match[1]);
        }
      }
    }

    // Also look for standalone auditorium numbers like "#7" or "7"
    const standalonePattern = /\b(?:#\s*)?(\d+)\b/;
    
    // Get lines that might contain auditorium info
    const relevantLines = text.split('\n').filter(line => 
      line.toLowerCase().includes('screen') || 
      line.toLowerCase().includes('theater') || 
      line.toLowerCase().includes('theatre') || 
      line.toLowerCase().includes('auditorium') ||
      line.toLowerCase().includes('cinema') ||
      line.toLowerCase().includes('room')
    );
    
    for (const line of relevantLines) {
      const match = line.match(standalonePattern);
      if (match && match[1]) {
        return `Theater ${match[1]}`;
      }
    }

    return null;
  }

  /**
   * Extracts theater room using contextual clues
   */
  private extractUsingContextualClues(text: string): string | null {
    const lines = text.split('\n');
    
    // Look for patterns like "Auditorium", "Screen", etc. followed by numbers or letters
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (
        lowerLine.includes('auditorium') ||
        lowerLine.includes('theater') ||
        lowerLine.includes('theatre') ||
        lowerLine.includes('screen') ||
        lowerLine.includes('cinema') ||
        lowerLine.includes('room')
      ) {
        // Try to find a number or letter in this line
        // First check for a specific pattern
        const roomMatch = lowerLine.match(/\s([a-z]|[0-9]+[a-z]?)\s*$/i);
        
        if (roomMatch) {
          return `Theater ${roomMatch[1].toUpperCase()}`;
        }
      }
    }
    
    // Look for IMAX, RPX, VIP, etc. special theater designations
    for (const line of lines) {
      if (/\b(IMAX|RPX|VIP|XD|PRIME|DOLBY|D-BOX)\b/i.test(line)) {
        return this.cleanText(line.match(/\b(IMAX|RPX|VIP|XD|PRIME|DOLBY|D-BOX)\b/i)![0]);
      }
    }
    
    return null;
  }
}

export default TheaterRoomExtractor.getInstance();
