import { TMDBMovie, TMDBMovieDetails, TMDBGenre } from "@/types";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
if (!API_KEY) {
  console.error("Warning: TMDB API key is not set");
}
const BASE_URL = "https://api.themoviedb.org/3";

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

// Search movies
export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];
  
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );

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
    const response = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
    );

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
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
    );

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
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`
    );

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
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
    );

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
    const response = await fetch(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch genres");
    }

    const data = await response.json();
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}
