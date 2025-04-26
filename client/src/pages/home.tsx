import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { WatchedMovieWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovieApi } from "@/hooks/useMovies";
import MovieGrid from "@/components/movies/MovieGrid";
import { useLocation } from "wouter";
import { GENRES } from "@/lib/tmdb";
import { TMDBMovie } from "@/types";

export default function Home() {
  const [, navigate] = useLocation();
  
  // Set document title
  useEffect(() => {
    document.title = "Home | Reelytics";
  }, []);

  // Fetch watched movies
  const { data: watchedMovies, isLoading: loadingMovies } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/watched"]
  });

  // Movie API hooks
  const { 
    getTrendingMovies, 
    getMoviesByGenre,
    isLoading: loadingTrending 
  } = useMovieApi();
  
  // Get trending movies from TMDB
  const { data: trendingMovies } = useQuery({
    queryKey: ["trending-movies"],
    queryFn: getTrendingMovies
  });
  
  // Get genre-specific movies
  const { data: sciFiMovies } = useQuery({
    queryKey: ["genre-movies", GENRES.SCIENCE_FICTION],
    queryFn: () => getMoviesByGenre(GENRES.SCIENCE_FICTION)
  });
  
  const { data: comedyMovies } = useQuery({
    queryKey: ["genre-movies", GENRES.COMEDY],
    queryFn: () => getMoviesByGenre(GENRES.COMEDY)
  });
  
  const { data: actionMovies } = useQuery({
    queryKey: ["genre-movies", GENRES.ACTION],
    queryFn: () => getMoviesByGenre(GENRES.ACTION)
  });
  
  const { data: horrorMovies } = useQuery({
    queryKey: ["genre-movies", GENRES.HORROR],
    queryFn: () => getMoviesByGenre(GENRES.HORROR)
  });

  if (loadingMovies && loadingTrending) {
    return (
      <div className="animate-pulse p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-48 mt-6" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  // Function to get random movie from a genre that has a backdrop
  const getRandomGenreMovie = (movies: TMDBMovie[] | undefined): TMDBMovie | null => {
    if (!movies || movies.length === 0) return null;
    
    // Filter movies that have backdrop images
    const moviesWithBackdrops = movies.filter(movie => movie.backdrop_path);
    if (moviesWithBackdrops.length === 0) return null;
    
    // Return random movie with backdrop
    return moviesWithBackdrops[Math.floor(Math.random() * moviesWithBackdrops.length)];
  };
  
  // Get random movies for each genre category
  const randomSciFiMovie = getRandomGenreMovie(sciFiMovies);
  const randomComedyMovie = getRandomGenreMovie(comedyMovies);
  const randomActionMovie = getRandomGenreMovie(actionMovies);
  const randomHorrorMovie = getRandomGenreMovie(horrorMovies);
  
  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Recently Watched</h2>
        {watchedMovies && watchedMovies.length > 0 ? (
          <MovieGrid
            movies={watchedMovies.slice(0, 6)}
            isLoading={loadingMovies}
            layout="grid"
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">You haven't watched any movies yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Add movies to your watched list to see them here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Trending Movies</h2>
        {trendingMovies && trendingMovies.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {trendingMovies.slice(0, 6).map((movie) => (
              <div 
                key={movie.id} 
                className="relative rounded-lg overflow-hidden shadow-sm cursor-pointer"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <div className="aspect-[2/3] bg-gray-200">
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '/placeholder.png'}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Unable to load trending movies.</p>
            </CardContent>
          </Card>
        )}
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Explore Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sci-Fi Category */}
          <div 
            className="relative h-40 rounded-xl overflow-hidden cursor-pointer shadow-md"
            onClick={() => navigate(`/search?genre=${GENRES.SCIENCE_FICTION}`)}
          >
            {randomSciFiMovie && randomSciFiMovie.backdrop_path ? (
              <>
                <img 
                  src={`https://image.tmdb.org/t/p/w780${randomSciFiMovie.backdrop_path}`}
                  alt="Science Fiction" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800"></div>
            )}
            <div className="absolute bottom-3 left-3 text-white font-bold text-xl">Science Fiction</div>
          </div>
          
          {/* Comedy Category */}
          <div 
            className="relative h-40 rounded-xl overflow-hidden cursor-pointer shadow-md"
            onClick={() => navigate(`/search?genre=${GENRES.COMEDY}`)}
          >
            {randomComedyMovie && randomComedyMovie.backdrop_path ? (
              <>
                <img 
                  src={`https://image.tmdb.org/t/p/w780${randomComedyMovie.backdrop_path}`}
                  alt="Comedy" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
            )}
            <div className="absolute bottom-3 left-3 text-white font-bold text-xl">Comedy</div>
          </div>
          
          {/* Action Category */}
          <div 
            className="relative h-40 rounded-xl overflow-hidden cursor-pointer shadow-md"
            onClick={() => navigate(`/search?genre=${GENRES.ACTION}`)}
          >
            {randomActionMovie && randomActionMovie.backdrop_path ? (
              <>
                <img 
                  src={`https://image.tmdb.org/t/p/w780${randomActionMovie.backdrop_path}`}
                  alt="Action" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-red-600 to-red-800"></div>
            )}
            <div className="absolute bottom-3 left-3 text-white font-bold text-xl">Action</div>
          </div>
          
          {/* Horror Category */}
          <div 
            className="relative h-40 rounded-xl overflow-hidden cursor-pointer shadow-md"
            onClick={() => navigate(`/search?genre=${GENRES.HORROR}`)}
          >
            {randomHorrorMovie && randomHorrorMovie.backdrop_path ? (
              <>
                <img 
                  src={`https://image.tmdb.org/t/p/w780${randomHorrorMovie.backdrop_path}`}
                  alt="Horror" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
            )}
            <div className="absolute bottom-3 left-3 text-white font-bold text-xl">Horror</div>
          </div>
        </div>
      </section>
    </div>
  );
}
