export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number;
  genre_ids: number[];
  adult: boolean;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: TMDBGenre[];
  runtime: number;
  director: string;
  cast: TMDBCastMember[];
  crew?: TMDBCrewMember[];
  tagline?: string;
  budget?: number;
  revenue?: number;
  popularity?: number;
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
  }[];
}
