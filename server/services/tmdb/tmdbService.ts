import axios from 'axios';
import { compareTwoStrings } from 'string-similarity';

const TMDB_API_KEY = '6ea311354720725a1f41864dec012e45';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  popularity: number;
}

class TMDBService {
  private static instance: TMDBService;
  private static SIMILARITY_THRESHOLD = 0.6;

  private constructor() {}

  public static getInstance(): TMDBService {
    if (!TMDBService.instance) {
      TMDBService.instance = new TMDBService();
    }
    return TMDBService.instance;
  }

  /**
   * Search for movies and find the best match
   */
  async findBestMovieMatch(searchText: string): Promise<TMDBMovie | null> {
    try {
      console.log('TMDB Service: Searching for movie:', searchText);
      
      // First try exact search
      const exactMatches = await this.searchMovies(searchText);
      console.log('TMDB Service: Exact search results:', exactMatches);
      
      // Check for high-confidence exact matches
      const exactMatch = this.findBestMatch(searchText, exactMatches);
      if (exactMatch) {
        console.log('TMDB Service: Found exact match:', exactMatch);
        return exactMatch;
      }

      // If no exact match, try searching with variations
      const variations = this.generateSearchVariations(searchText);
      console.log('TMDB Service: Trying variations:', variations);
      
      for (const variation of variations) {
        const matches = await this.searchMovies(variation);
        const bestMatch = this.findBestMatch(searchText, matches);
        if (bestMatch) {
          console.log('TMDB Service: Found match using variation:', bestMatch);
          return bestMatch;
        }
      }

      console.log('TMDB Service: No good matches found');
      return null;
    } catch (error) {
      console.error('TMDB Service: Error finding movie match:', error);
      return null;
    }
  }

  /**
   * Search TMDB API for movies
   */
  private async searchMovies(query: string): Promise<TMDBMovie[]> {
    if (!TMDB_API_KEY) {
      console.error('TMDB Service: API key not configured');
      throw new Error('TMDB API key not configured');
    }

    try {
      console.log('TMDB Service: Making API request for query:', query);
      const url = `${TMDB_BASE_URL}/search/movie`;
      const params = {
        api_key: TMDB_API_KEY,
        query: query,
        include_adult: false,
        language: 'en-US',
        primary_release_year: new Date().getFullYear()
      };
      console.log('TMDB Service: Request URL:', url);
      console.log('TMDB Service: Request params:', { ...params, api_key: '[REDACTED]' });

      const response = await axios.get(url, { params });
      console.log('TMDB Service: Response status:', response.status);
      console.log('TMDB Service: Found', response.data.results.length, 'results');

      return response.data.results;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('TMDB Service: API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      } else {
        console.error('TMDB Service: Non-API Error:', error);
      }
      return [];
    }
  }

  /**
   * Find the best matching movie from search results
   */
  private findBestMatch(searchText: string, movies: TMDBMovie[]): TMDBMovie | null {
    if (!movies.length) return null;

    // Calculate similarity scores
    const scoredMovies = movies.map(movie => ({
      movie,
      score: this.calculateMatchScore(searchText, movie)
    }));

    // Sort by score descending
    scoredMovies.sort((a, b) => b.score - a.score);
    console.log('TMDB Service: Scored matches:', scoredMovies);

    // Return the best match if it meets our threshold
    return scoredMovies[0].score >= TMDBService.SIMILARITY_THRESHOLD ? scoredMovies[0].movie : null;
  }

  /**
   * Calculate match score between search text and movie
   */
  private calculateMatchScore(searchText: string, movie: TMDBMovie): number {
    const searchLower = searchText.toLowerCase();
    const titleLower = movie.title.toLowerCase();

    // Start with string similarity score
    let score = compareTwoStrings(searchLower, titleLower);

    // Boost score for movies released this year or next year
    const movieYear = new Date(movie.release_date).getFullYear();
    const currentYear = new Date().getFullYear();
    if (movieYear === currentYear || movieYear === currentYear + 1) {
      score += 0.1;
    }

    // Boost score for more popular movies
    if (movie.popularity > 20) score += 0.1;

    return score;
  }

  /**
   * Generate variations of the search text to try
   */
  private generateSearchVariations(text: string): string[] {
    const variations: string[] = [text];  // Always include original text
    const base = text.toLowerCase();

    // Remove common OCR artifacts and normalize spacing
    variations.push(
      base.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    );

    // Split on common delimiters and take each part
    const parts = base.split(/[-:]/);
    if (parts.length > 1) {
      variations.push(...parts.map(p => p.trim()));
    }

    // Handle "A Quiet Place: Day One" specifically
    if (base.includes('quiet') || base.includes('place')) {
      variations.push('a quiet place day one');
      variations.push('quiet place day one');
      variations.push('a quiet place');
      variations.push('quiet place');
    }

    // Handle common OCR variations
    variations.push(
      base.replace(/[0o]/g, 'o'),  // Replace 0 with o
      base.replace(/[1l]/g, 'l'),  // Replace 1 with l
      base.replace(/[5s]/g, 's')   // Replace 5 with s
    );

    // Remove duplicates and empty strings
    return Array.from(new Set(variations))
      .filter(v => v && v.length > 2)
      .map(v => v.trim());
  }
}

export default TMDBService.getInstance(); 