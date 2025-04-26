import { useState } from "react";
import { TMDBMovie, TMDBMovieDetails } from "@/types";
import * as tmdbApi from "@/lib/tmdb";

export function useMovieApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search movies by query
  const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
    if (!query) return [];
    setIsLoading(true);
    setError(null);

    try {
      const results = await tmdbApi.searchMovies(query);
      return results;
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
      const results = await tmdbApi.getTrendingMovies();
      return results;
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
      const details = await tmdbApi.getMovieDetails(movieId);
      return details;
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
      const results = await tmdbApi.getSimilarMovies(movieId);
      return results;
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
