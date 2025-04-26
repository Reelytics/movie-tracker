import { TMDBMovie, TMDBMovieDetails } from "@/types";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "32c7e47c8cc15c4ac3219c6f6c1b2c17"; // Demo API key
const BASE_URL = "https://api.themoviedb.org/3";

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
