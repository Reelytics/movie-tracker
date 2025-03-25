import { Movie, InsertMovie } from "@shared/schema";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Image sizes for posters and backdrops
const POSTER_SIZE = 'w500';  // Options: w92, w154, w185, w342, w500, w780, original
const BACKDROP_SIZE = 'w1280'; // Options: w300, w780, w1280, original

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
}

// Helper function to make API requests
async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // Build query parameters including the API key
  const queryParams = new URLSearchParams({
    ...params,
    api_key: TMDB_API_KEY || '',
  }).toString();

  const url = `${BASE_URL}${endpoint}?${queryParams}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Function to search movies
export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
    language: 'en-US',
  });
}

// Function to get movie details
export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  return fetchFromTMDB<TMDBMovie>(`/movie/${movieId}`, {
    append_to_response: 'credits,watch/providers',
    language: 'en-US',
  });
}

// Function to get popular movies
export async function getPopularMovies(page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>('/movie/popular', {
    page: page.toString(),
    language: 'en-US',
  });
}

// Function to get now playing movies
export async function getNowPlayingMovies(page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>('/movie/now_playing', {
    page: page.toString(),
    language: 'en-US',
  });
}

// Helper to convert TMDB movie to our app's movie format
export function convertTMDBMovieToInsertMovie(movie: TMDBMovie): InsertMovie {
  const releaseYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : 0;
  
  return {
    title: movie.title,
    year: releaseYear,
    posterUrl: movie.poster_path ? `${IMAGE_BASE_URL}${POSTER_SIZE}${movie.poster_path}` : undefined,
    backdropUrl: movie.backdrop_path ? `${IMAGE_BASE_URL}${BACKDROP_SIZE}${movie.backdrop_path}` : undefined,
    synopsis: movie.overview || undefined,
    runtime: movie.runtime ? `${movie.runtime} min` : undefined,
    rating: Math.round(movie.vote_average * 10) // Convert 0-10 scale to 0-100
  };
}

// Function to extract year from date string (YYYY-MM-DD)
export function extractYearFromDate(dateString: string | null): number {
  if (!dateString) return 0;
  const match = dateString.match(/^(\d{4})/);
  return match ? parseInt(match[1]) : 0;
}

// Function to get full image URL
export function getFullImagePath(path: string | null, size: string = POSTER_SIZE): string | undefined {
  if (!path) return undefined;
  return `${IMAGE_BASE_URL}${size}${path}`;
}