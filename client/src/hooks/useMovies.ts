import { useState } from "react";
import { TMDBMovie, TMDBMovieDetails } from "@/types";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "32c7e47c8cc15c4ac3219c6f6c1b2c17"; // Demo API key for example
const BASE_URL = "https://api.themoviedb.org/3";

export function useMovieApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search movies by query
  const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
    if (!query) return [];
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
      );

      if (!response.ok) {
        throw new Error("Failed to search movies");
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get trending movies
  const getTrendingMovies = async (): Promise<TMDBMovie[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trending movies");
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get movie details
  const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get movie details
      const detailsResponse = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );

      if (!detailsResponse.ok) {
        throw new Error("Failed to fetch movie details");
      }

      const details = await detailsResponse.json();

      // Format the data
      const director = details.credits?.crew?.find(
        (person: any) => person.job === "Director"
      )?.name || "Unknown Director";

      return {
        ...details,
        director,
        cast: details.credits?.cast || []
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get similar movies
  const getSimilarMovies = async (movieId: number): Promise<TMDBMovie[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch similar movies");
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchMovies,
    getTrendingMovies,
    getMovieDetails,
    getSimilarMovies,
    isLoading,
    error
  };
}
