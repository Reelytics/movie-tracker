import { TMDBMovie, TMDBMovieDetails, TMDBGenre } from "@/types";

// API configuration
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '6ea311354720725a1f41864dec012e45';
const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

// Check if API key is available
if (!API_KEY) {
  console.error("Warning: TMDB API key is not set");
}

// Default headers for fetch requests using the Bearer token
const headers = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

// Genre ID mapping
export const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37
};

// Helper function to create URL with API key
const getApiUrl = (endpoint: string, params: Record<string, string | number> = {}): string => {
  const searchParams = new URLSearchParams();
  searchParams.append('api_key', API_KEY);
  
  // Add additional params
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value.toString());
  });
  
  return `${BASE_URL}${endpoint}?${searchParams.toString()}`;
};

// Search movies
export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];
  
  try {
    const url = getApiUrl('/search/movie', { query, include_adult: false });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to search movies");
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

// Get trending movies
export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  try {
    const url = getApiUrl('/trending/movie/week');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch trending movies");
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
}

// Get movie details
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  try {
    const url = getApiUrl(`/movie/${movieId}`, { append_to_response: 'credits' });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch movie details");
    }

    const data = await response.json();
    
    // Format director info
    const director = data.credits?.crew?.find(
      (person: any) => person.job === "Director"
    )?.name || "Unknown Director";

    return {
      ...data,
      director,
      cast: data.credits?.cast || []
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
}

// Get similar movies
export async function getSimilarMovies(movieId: number): Promise<TMDBMovie[]> {
  try {
    const url = getApiUrl(`/movie/${movieId}/similar`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch similar movies");
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    return [];
  }
}

// Get movies by genre
export async function getMoviesByGenre(genreId: number): Promise<TMDBMovie[]> {
  try {
    const url = getApiUrl('/discover/movie', { 
      with_genres: genreId,
      sort_by: 'popularity.desc'
    });
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movies for genre ${genreId}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    return [];
  }
}

// Get all genres
export async function getGenres(): Promise<TMDBGenre[]> {
  try {
    const url = getApiUrl('/genre/movie/list');
    
    // Add a cache bust parameter to prevent stale cache issues
    const cacheBustUrl = `${url}&_cb=${Date.now()}`;
    
    console.log("Making genre API request to:", cacheBustUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(cacheBustUrl, { 
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Genre API response not OK:", response.status, response.statusText);
      throw new Error(`Failed to fetch genres: ${response.status} ${response.statusText}`);
    }

    // Check if response is valid JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Invalid content type for genre response:", contentType);
      throw new Error(`Invalid response format: ${contentType}`);
    }

    const data = await response.json();
    
    if (!data || !data.genres || !Array.isArray(data.genres)) {
      console.error("Invalid genres data format:", data);
      throw new Error("Invalid genres data format");
    }
    
    console.log(`Successfully fetched ${data.genres.length} genres`);
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    // Return empty array instead of throwing to prevent cascading errors
    return [];
  }
}

// Generic fetch function for TMDB API
export async function fetchTMDB(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
  try {
    const url = getApiUrl(endpoint, params);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from TMDB: ${endpoint}`, error);
    throw error;
  }
}
