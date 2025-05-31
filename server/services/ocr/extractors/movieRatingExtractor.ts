import BaseExtractor from './baseExtractor';

/**
 * Extracts movie rating (PG, R, PG-13, etc.) from OCR text
 */
class MovieRatingExtractor extends BaseExtractor {
  private static instance: MovieRatingExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): MovieRatingExtractor {
    if (!MovieRatingExtractor.instance) {
      MovieRatingExtractor.instance = new MovieRatingExtractor();
    }
    return MovieRatingExtractor.instance;
  }

  extract(ocrText: string): string | null {
    if (!ocrText || ocrText.trim() === '') {
      return null;
    }

    const cleanedText = ocrText.toLowerCase();
    
    // Try different methods of extracting the movie rating
    const candidates = [
      this.extractUsingRatingPrefix(cleanedText),
      this.extractUsingStandardRatings(cleanedText),
      this.extractUsingContextualPosition(cleanedText)
    ];

    return this.findBestMatch(candidates);
  }

  /**
   * Extracts rating by looking for common prefixes
   */
  private extractUsingRatingPrefix(text: string): string | null {
    // Common prefixes that might precede a movie rating on a ticket
    const ratingPrefixes = [
      'rating:',
      'rated:',
      'film rating:',
      'movie rating:'
    ];

    for (const prefix of ratingPrefixes) {
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
            endIndex = Math.min(startIndex + 5, text.length);
          }
        }
        
        const ratingText = text.substring(startIndex, endIndex).trim();
        const standardizedRating = this.standardizeRating(ratingText);
        
        if (standardizedRating) {
          return standardizedRating;
        }
      }
    }

    return null;
  }

  /**
   * Extracts rating by looking for standard movie rating patterns
   */
  private extractUsingStandardRatings(text: string): string | null {
    // Look for standard rating formats: G, PG, PG-13, R, NC-17
    // These may appear in various formats: "PG-13", "(PG-13)", "Rated PG-13", etc.
    const ratingPatterns = [
      /\b(G|PG|PG-13|R|NC-17)\b/i,
      /\(?(G|PG|PG-13|R|NC-17)\)?/i,
      /\bRated\s+(G|PG|PG-13|R|NC-17)\b/i
    ];

    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Standardize the extracted rating
        return this.standardizeRating(match[1] || match[0]);
      }
    }

    return null;
  }

  /**
   * Extracts rating by looking at contextual positioning
   */
  private extractUsingContextualPosition(text: string): string | null {
    const lines = text.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check for lines that contain the word "rating" or specific ratings
      if (
        lowerLine.includes('rating') || 
        /\b(G|PG|PG-13|R|NC-17)\b/i.test(lowerLine)
      ) {
        // Extract the rating from this line
        const match = lowerLine.match(/\b(G|PG|PG-13|R|NC-17)\b/i);
        if (match) {
          return this.standardizeRating(match[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Standardizes different formats of ratings to a consistent format
   */
  private standardizeRating(rating: string): string | null {
    if (!rating) return null;
    
    const cleanRating = rating.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Map of various forms to standard ratings
    const ratingMap: { [key: string]: string } = {
      'G': 'G',
      'PG': 'PG',
      'PG13': 'PG-13',
      'PG-13': 'PG-13',
      'R': 'R',
      'NC17': 'NC-17',
      'NC-17': 'NC-17'
    };
    
    return ratingMap[cleanRating] || null;
  }
}

export default MovieRatingExtractor.getInstance();
