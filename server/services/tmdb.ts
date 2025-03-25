import { InsertMovie } from "@shared/schema";

// API Configuration
const API_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_SIZE = "w342";
const BACKDROP_SIZE = "w1280";

// These values will come from environment variables
const API_KEY = process.env.TMDB_API_KEY || "";
const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || "";

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

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // Add API key to params if using API key auth
  if (API_KEY) {
    params.api_key = API_KEY;
  }

  // Construct URL with params
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}?${queryParams}`;

  // Setup fetch options - use access token if available
  const options: RequestInit = {
    headers: ACCESS_TOKEN
      ? {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
  };

  // Make the request
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TMDB API Error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>("/search/movie", {
    query,
    page: page.toString(),
    include_adult: "false",
    language: "en-US",
  });
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  return fetchFromTMDB<TMDBMovie>(`/movie/${movieId}`, {
    append_to_response: "credits,videos",
    language: "en-US",
  });
}

export async function getPopularMovies(page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>("/movie/popular", {
    page: page.toString(),
    language: "en-US",
  });
}

export async function getNowPlayingMovies(page: number = 1): Promise<TMDBSearchResult> {
  return fetchFromTMDB<TMDBSearchResult>("/movie/now_playing", {
    page: page.toString(),
    language: "en-US",
  });
}

export function convertTMDBMovieToInsertMovie(movie: TMDBMovie): InsertMovie {
  return {
    title: movie.title,
    year: extractYearFromDate(movie.release_date),
    posterUrl: getFullImagePath(movie.poster_path),
    backdropUrl: getFullImagePath(movie.backdrop_path, BACKDROP_SIZE),
    overview: movie.overview || undefined,
    runtime: movie.runtime || undefined,
    rating: Math.round(movie.vote_average),
    tmdbId: movie.id,
  };
}

export function extractYearFromDate(dateString: string | null): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  return date.getFullYear();
}

export function getFullImagePath(path: string | null, size: string = POSTER_SIZE): string | undefined {
  if (!path) return undefined;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}