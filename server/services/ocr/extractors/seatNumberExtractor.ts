import BaseExtractor from './baseExtractor';

class SeatNumberExtractor extends BaseExtractor {
  private static instance: SeatNumberExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): SeatNumberExtractor {
    if (!SeatNumberExtractor.instance) {
      SeatNumberExtractor.instance = new SeatNumberExtractor();
    }
    return SeatNumberExtractor.instance;
  }

  async extract(ocrText: string): Promise<string | null> {
    if (!ocrText) return null;

    // Common seat number patterns
    const seatPatterns = [
      // Row letter + number (e.g., "A12", "ROW A12", "SEAT A12")
      /\b(?:ROW\s+)?([A-Z])[-\s]*(\d{1,2})\b/i,
      // Just seat number with prefix (e.g., "SEAT 12", "NO. 12")
      /\b(?:SEAT|NO\.?)\s*(\d{1,2})\b/i,
      // Row and seat separated (e.g., "ROW A SEAT 12")
      /\bROW\s+([A-Z])(?:\s+(?:SEAT|NO\.?)\s+|-\s*|:\s*)?(\d{1,2})\b/i
    ];

    const lines = ocrText.split('\n');
    
    for (const line of lines) {
      const lowercaseLine = line.toLowerCase();
      
      // Skip lines that are clearly not about seating
      if (lowercaseLine.includes('price') || 
          lowercaseLine.includes('total') || 
          lowercaseLine.includes('$')) {
        continue;
      }

      for (const pattern of seatPatterns) {
        const match = line.match(pattern);
        if (match) {
          // If we have both row and seat number
          if (match[2]) {
            const row = match[1].toUpperCase();
            const seatNum = match[2].padStart(2, '0');
            return `${row}-${seatNum}`;
          }
          // If we only have a seat number
          else if (match[1]) {
            return match[1].padStart(2, '0');
          }
        }
      }
    }

    return null;
  }
}

export default SeatNumberExtractor.getInstance(); 