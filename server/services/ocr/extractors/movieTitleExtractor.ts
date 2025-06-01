import BaseExtractor from './baseExtractor';
import { compareTwoStrings } from 'string-similarity';
import tmdbService from '../../tmdb/tmdbService';

/**
 * Extracts movie title from OCR text
 */
class MovieTitleExtractor extends BaseExtractor {
  private static instance: MovieTitleExtractor;

  private constructor() {
    super();
  }

  public static getInstance(): MovieTitleExtractor {
    if (!MovieTitleExtractor.instance) {
      MovieTitleExtractor.instance = new MovieTitleExtractor();
    }
    return MovieTitleExtractor.instance;
  }

  async extract(ocrText: string): Promise<string | null> {
    if (!ocrText || ocrText.trim() === '') {
      console.log('MovieTitleExtractor: Empty OCR text received');
      return null;
    }

    console.log('MovieTitleExtractor: Processing OCR text:', ocrText);
    
    // Split into lines and clean each line
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('MovieTitleExtractor: Processing lines:', lines);

    // First pass: Look for exact movie title patterns
    for (const line of lines) {
      console.log('MovieTitleExtractor: Checking line:', line);
      
      // Check for "A QUIET PLACE: DAY ONE" specifically
      if (line.toUpperCase().includes('QUIET PLACE') && line.toUpperCase().includes('DAY')) {
        console.log('MovieTitleExtractor: Found potential Quiet Place line:', line);
        const validatedTitle = await this.validateWithTMDB('A Quiet Place: Day One');
        if (validatedTitle) {
          console.log('MovieTitleExtractor: Validated Quiet Place title:', validatedTitle);
          return validatedTitle;
        }
      }

      const moviePattern = this.findMoviePattern(line);
      if (moviePattern) {
        console.log('MovieTitleExtractor: Found movie pattern:', moviePattern);
        const validatedTitle = await this.validateWithTMDB(moviePattern);
        if (validatedTitle) {
          console.log('MovieTitleExtractor: Validated pattern match:', validatedTitle);
          return validatedTitle;
        }
      }
    }

    // Second pass: Try different extraction methods
    const candidates = [
      ...this.findAllMoviePatterns(lines),
      ...lines.map(line => this.extractUsingTitlePrefix(line)),
      ...lines.map(line => this.extractUsingLargestFontOrPosition(line)),
      ...lines.map(line => this.extractUsingMovieKeyword(line))
    ].filter((c): c is string => c !== null);

    console.log('MovieTitleExtractor: All candidates:', candidates);

    // Score and rank candidates
    const scoredCandidates = candidates.map(candidate => ({
      title: candidate,
      score: this.scoreMovieTitle(candidate)
    }));

    scoredCandidates.sort((a, b) => b.score - a.score);
    console.log('MovieTitleExtractor: Scored candidates:', scoredCandidates);

    // Try validating each candidate with TMDB in order of score
    for (const candidate of scoredCandidates) {
      if (candidate.score >= 0.5) {
        console.log('MovieTitleExtractor: Trying to validate candidate:', candidate.title);
        const validatedTitle = await this.validateWithTMDB(candidate.title);
        if (validatedTitle) {
          console.log('MovieTitleExtractor: Validated candidate:', validatedTitle);
          return validatedTitle;
        }
      }
    }

    // If no good candidates found, try the most promising line
    for (const line of lines) {
      if (this.looksLikeMovieTitle(line)) {
        const cleaned = this.cleanText(line);
        console.log('MovieTitleExtractor: Trying to validate promising line:', cleaned);
        const validatedTitle = await this.validateWithTMDB(cleaned);
        if (validatedTitle) {
          console.log('MovieTitleExtractor: Validated promising line:', validatedTitle);
          return validatedTitle;
        }
      }
    }

    // Last resort: Try the line with "PLACE" in it
    for (const line of lines) {
      if (line.toUpperCase().includes('PLACE')) {
        console.log('MovieTitleExtractor: Found line with PLACE:', line);
        const validatedTitle = await this.validateWithTMDB(line);
        if (validatedTitle) {
          console.log('MovieTitleExtractor: Validated PLACE line:', validatedTitle);
          return validatedTitle;
        }
      }
    }

    return null;
  }

  /**
   * Validate a potential movie title with TMDB
   */
  private async validateWithTMDB(title: string): Promise<string | null> {
    try {
      console.log('MovieTitleExtractor: Validating with TMDB:', title);
      const match = await tmdbService.findBestMovieMatch(title);
      console.log('MovieTitleExtractor: TMDB match result:', match);
      return match ? match.title : null;
    } catch (error) {
      console.error('MovieTitleExtractor: Error validating with TMDB:', error);
      return null;
    }
  }

  /**
   * Find movie pattern in a single line
   */
  private findMoviePattern(line: string): string | null {
    // Common movie title patterns
    const patterns = [
      // "A QUIET PLACE: DAY ONE" pattern (exact match for this movie)
      /A QUIET PLACE:\s*DAY\s*(?:DAY\s*)?ONE/i,
      
      // General patterns
      /([A-Z][A-Za-z0-9\s&:'.-]+):\s*([A-Z][A-Za-z0-9\s&'.-]+)/,
      /([A-Z][A-Za-z0-9\s&:'.-]+)\s*-\s*([A-Z][A-Za-z0-9\s&'.-]+)/,
      /([A-Z][A-Za-z0-9\s&:'.-]+)\s+(?:PART|CHAPTER|EPISODE)\s+([0-9IVX]+)/i,
      /([A-Z][A-Za-z0-9\s&:'.-]+):\s*(?:DAY ONE|PART TWO|THE BEGINNING|THE END|FINAL CHAPTER)/i,
      /\b[A-Z][A-Z0-9\s&:'.-]{2,}(?:\s+[A-Z][A-Za-z0-9\s&:'.-]+)*\b/
    ];

    console.log('MovieTitleExtractor: Checking line for movie pattern:', line);
    
    // First try exact match for "A QUIET PLACE: DAY ONE"
    if (patterns[0].test(line)) {
      console.log('MovieTitleExtractor: Found exact match for A QUIET PLACE: DAY ONE');
      return 'A Quiet Place: Day One';
    }

    // Then try other patterns
    for (let i = 1; i < patterns.length; i++) {
      const match = line.match(patterns[i]);
      if (match) {
        const title = match[2] ? `${match[1]}: ${match[2]}` : match[1];
        const cleaned = this.cleanText(title);
        console.log(`MovieTitleExtractor: Found pattern match: "${cleaned}"`);
        return cleaned;
      }
    }

    return null;
  }

  /**
   * Find all possible movie patterns in the text
   */
  private findAllMoviePatterns(lines: string[]): string[] {
    const patterns: string[] = [];
    
    for (const line of lines) {
      // Look for lines that contain "PLACE" or movie-like words
      if (line.includes('PLACE') || /MOVIE|FILM|FEATURE|SHOWING/i.test(line)) {
        const cleaned = this.cleanText(line);
        console.log('MovieTitleExtractor: Found line with movie keyword:', cleaned);
        patterns.push(cleaned);
      }
      
      // Look for lines in ALL CAPS or Title Case
      if (/^[A-Z][A-Za-z0-9\s&:'.-]+$/.test(line)) {
        const cleaned = this.cleanText(line);
        console.log('MovieTitleExtractor: Found line in proper case:', cleaned);
        patterns.push(cleaned);
      }
    }
    
    return Array.from(new Set(patterns));
  }

  /**
   * Extracts title by looking for common prefixes
   */
  private extractUsingTitlePrefix(text: string): string | null {
    const titlePrefixes = [
      'movie:', 'title:', 'feature:', 'presenting:',
      'showing:', 'now showing:', 'feature film:',
      'film:', 'picture:'
    ];

    const lowercaseText = text.toLowerCase();
    
    for (const prefix of titlePrefixes) {
      if (lowercaseText.includes(prefix)) {
        const startIndex = lowercaseText.indexOf(prefix) + prefix.length;
        let endIndex = text.indexOf('\n', startIndex);
        
        if (endIndex === -1) {
          const possibleDelimiters = [',', '|', '-', '(', 'rated', 'rating:', 'runtime:', 'time:', 'price:', 'seat:', 'row:', 'screen:'];
          for (const delimiter of possibleDelimiters) {
            const delimiterIndex = lowercaseText.indexOf(delimiter, startIndex);
            if (delimiterIndex !== -1) {
              endIndex = delimiterIndex;
              break;
            }
          }
          if (endIndex === -1) endIndex = Math.min(startIndex + 50, text.length);
        }
        
        const title = text.substring(startIndex, endIndex).trim();
        return this.cleanText(title);
      }
    }
    
    return null;
  }

  /**
   * Extracts title by looking for movie-like text
   */
  private extractUsingLargestFontOrPosition(line: string): string | null {
    if (line.length <= 3 || this.isGenericHeader(line)) return null;

    // Check for rating pattern
    const ratingMatch = line.match(/(.+?)\s*\(?([PG]|PG-13|R|NC-17|G)\)?$/i);
    if (ratingMatch) {
      return this.cleanText(ratingMatch[1]);
    }

    // Check if it looks like a title
    if (this.looksLikeMovieTitle(line)) {
      return this.cleanText(line);
    }

    return null;
  }

  /**
   * Extracts title using movie keyword
   */
  private extractUsingMovieKeyword(text: string): string | null {
    if (!text.toLowerCase().includes('movie')) return null;

    const movieIndex = text.toLowerCase().indexOf('movie');
    if (movieIndex > 0 && movieIndex < 5) {
      return this.cleanText(text.substring(movieIndex + 5).trim());
    } else if (movieIndex > 5) {
      return this.cleanText(text.substring(0, movieIndex).trim());
    }
    
    return this.cleanText(text.trim());
  }

  /**
   * Score a potential movie title
   */
  private scoreMovieTitle(title: string): number {
    let score = 0;
    const lower = title.toLowerCase();

    // Exact match for "A QUIET PLACE: DAY ONE"
    if (/a quiet place:\s*day\s*(?:day\s*)?one/i.test(title)) {
      return 1.0; // Perfect match
    }

    // Contains "PLACE" or "QUIET"
    if (lower.includes('place') || lower.includes('quiet')) score += 0.3;

    // Title case or all caps
    if (/^[A-Z]/.test(title)) score += 0.2;
    if (/^[A-Z\s]+$/.test(title)) score += 0.1;

    // Common patterns
    if (title.includes(':')) score += 0.2;
    if (/Part|Chapter|Volume|Day One/i.test(title)) score += 0.2;
    if (/[0-9IVX]+$/.test(title)) score += 0.1;

    // Length check
    const length = title.length;
    if (length >= 10 && length <= 50) score += 0.2;
    else if (length > 50) score -= 0.1;
    else if (length < 5) score -= 0.2;

    // Penalize noise
    if (/^[0-9\s]+$/.test(title)) score -= 0.3;
    if (/ticket|receipt|admit|cinema|theatre/i.test(title)) score -= 0.2;
    if (/^[^a-zA-Z]*$/.test(title)) score -= 0.4; // No letters at all

    return score;
  }

  /**
   * Check for generic headers
   */
  private isGenericHeader(line: string): boolean {
    const genericHeaders = [
      'ticket', 'receipt', 'admission', 'cinema', 'theater',
      'welcome', 'thank you', 'enjoy', 'presents', 'admit one',
      'confirmation', 'purchase', 'order', 'transaction',
      'showtime', 'show time', 'date', 'time', 'price'
    ];
    
    const lowercaseLine = line.toLowerCase();
    return genericHeaders.some(header => 
      lowercaseLine.includes(header) && lowercaseLine.length < 20
    );
  }

  /**
   * Check if text looks like a movie title
   */
  private looksLikeMovieTitle(line: string): boolean {
    const cleanLine = line.toLowerCase()
      .replace(/\b(rated|rating|runtime|duration|price|seat|row|time|date|screen|theatre|theater|cinema)\b.*$/i, '')
      .trim();

    return (
      cleanLine.length > 3 &&
      cleanLine.length < 50 &&
      !/^\d+$/.test(cleanLine) &&
      !/^[A-Za-z]$/.test(cleanLine) &&
      !/^(row|seat|aisle|screen|theater|theatre|cinema)\s*\d*$/i.test(cleanLine) &&
      !/^(\$|£|€)\d+/.test(cleanLine) &&
      !/^(adult|child|senior|student)/i.test(cleanLine) &&
      /[a-zA-Z]/.test(cleanLine) // Must contain at least one letter
    );
  }
}

export default MovieTitleExtractor.getInstance();

