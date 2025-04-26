import { useState, useCallback } from "react";
import { TMDBMovie, TMDBMovieDetails, TMDBGenre } from "@/types";
import * as tmdbApi from "@/lib/tmdb";

export function useMovieApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search movies by query
  const searchMovies = useCallback(async (query: string): Promise<TMDBMovie[]> => {
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
  }, []);

  // Get trending movies
  const getTrendingMovies = useCallback(async (): Promise<TMDBMovie[]> => {
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
  }, []);

  // Get movie details
  const getMovieDetails = useCallback(async (movieId: number): Promise<TMDBMovieDetails> => {
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
  }, []);

  // Get similar movies
  const getSimilarMovies = useCallback(async (movieId: number): Promise<TMDBMovie[]> => {
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
  }, []);
  
  // Get movies by genre
  const getMoviesByGenre = useCallback(async (genreId: number): Promise<TMDBMovie[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await tmdbApi.getMoviesByGenre(genreId);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get all genres
  const getGenres = useCallback(async (): Promise<TMDBGenre[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await tmdbApi.getGenres();
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchMovies,
    getTrendingMovies,
    getMovieDetails,
    getSimilarMovies,
    getMoviesByGenre,
    getGenres,
    isLoading,
    error
  };
}
