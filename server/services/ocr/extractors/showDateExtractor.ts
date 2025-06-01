import BaseExtractor from './baseExtractor';

class ShowDateExtractor extends BaseExtractor {
  private static instance: ShowDateExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): ShowDateExtractor {
    if (!ShowDateExtractor.instance) {
      ShowDateExtractor.instance = new ShowDateExtractor();
    }
    return ShowDateExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText) return null;

    // Common date formats
    const datePatterns = [
      // MM/DD/YY
      /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/(\d{2}|\d{4})\b/,
      // MM-DD-YY
      /\b(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-(\d{2}|\d{4})\b/,
      // Month DD, YYYY
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(0?[1-9]|[12][0-9]|3[01])(?:,?\s+(\d{4}))?\b/i
    ];

    const lines = ocrText.split('\n');
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Format as MM/DD/YY
          if (match[1] && match[2] && match[3]) {
            const month = match[1].padStart(2, '0');
            const day = match[2].padStart(2, '0');
            const year = match[3].length === 2 ? match[3] : match[3].slice(-2);
            return `${month}/${day}/${year}`;
          }
        }
      }
    }

    return null;
  }
}

export default ShowDateExtractor.getInstance(); 