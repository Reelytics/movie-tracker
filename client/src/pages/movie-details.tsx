import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMovieApi } from "@/hooks/useMovies";
import { TMDBMovieDetails, TMDBMovie } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Plus, Heart, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import RateMovieModal from "@/components/movies/RateMovieModal";

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id);
  const [, navigate] = useLocation();
  const { getMovieDetails, getSimilarMovies, isLoading, error } = useMovieApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [showRateModal, setShowRateModal] = useState(false);
  
  useEffect(() => {
    async function loadMovieData() {
      try {
        const movieDetails = await getMovieDetails(movieId);
        setMovie(movieDetails);
        document.title = `${movieDetails.title} | Reelytics`;
        
        const similar = await getSimilarMovies(movieId);
        setSimilarMovies(similar.slice(0, 6)); // Show just 6 similar movies
      } catch (err) {
        console.error("Failed to load movie data:", err);
        toast({
          title: "Error loading movie",
          description: "Failed to load movie details. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    if (movieId) {
      loadMovieData();
    }
  }, [movieId, getMovieDetails, getSimilarMovies, toast]);
  
  // Add movie to watched list
  const addToWatchedMutation = useMutation({
    mutationFn: async (tmdbMovie: TMDBMovie | TMDBMovieDetails) => {
      // Format the movie data for our API
      const movieData = {
        movie: {
          tmdbId: tmdbMovie.id,
          title: tmdbMovie.title,
          posterPath: tmdbMovie.poster_path,
          backdropPath: tmdbMovie.backdrop_path,
          releaseYear: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
          overview: tmdbMovie.overview,
        },
        watchedAt: new Date().toISOString(),
      };
      
      return apiRequest("POST", "/api/movies", movieData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      toast({
        title: "Movie added to your watched list",
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding movie",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleAddMovie = () => {
    if (movie) {
      if (user) {
        setShowRateModal(true);
      } else {
        toast({
          title: "Please log in",
          description: "You need to be logged in to add movies to your collection",
          variant: "destructive"
        });
        navigate("/auth");
      }
    }
  };
  
  const goBack = () => {
    navigate("/");
  };
  
  if (isLoading || !movie) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
          <Skeleton className="h-full w-full" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-32 h-48 -mt-20 rounded-lg overflow-hidden border-4 border-white shadow-lg">
            <Skeleton className="h-full w-full" />
          </div>
          
          <div className="flex-1">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4 mb-4" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-20">
      {/* Backdrop Image */}
      <div className="relative w-full h-64 md:h-96 bg-gray-200 mb-6">
        {movie.backdrop_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-75" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-4 left-4 bg-white/80 hover:bg-white"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Movie Poster */}
          <div className="relative md:w-1/3">
            <div className="w-32 md:w-full h-48 md:h-auto aspect-[2/3] -mt-20 rounded-lg overflow-hidden border-4 border-white shadow-lg">
              {movie.poster_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No poster</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleAddMovie}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Watched
              </Button>
            </div>
          </div>
          
          {/* Movie Info */}
          <div className="md:w-2/3">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{movie.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm text-gray-600">
              {movie.release_date && (
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(movie.release_date).getFullYear()}
                </div>
              )}
              
              {movie.runtime && (
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </div>
              )}
              
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                {movie.vote_average?.toFixed(1)} / 10
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres?.map(genre => (
                <Badge key={genre.id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
            
            {movie.tagline && (
              <p className="italic text-gray-600 mb-4">"{movie.tagline}"</p>
            )}
            
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-gray-700 mb-6">{movie.overview}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-1">Director</h3>
                <p className="text-gray-700">{movie.director}</p>
              </div>
              
              {movie.budget && movie.budget > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Budget</h3>
                  <p className="text-gray-700">${(movie.budget / 1000000).toFixed(1)}M</p>
                </div>
              )}
            </div>
            
            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <>
                <h3 className="font-semibold mb-3">Cast</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {movie.cast.slice(0, 6).map(person => (
                    <div key={person.id} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {person.profile_path && (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm leading-tight">{person.name}</p>
                        <p className="text-xs text-gray-500 leading-tight">{person.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="font-semibold mb-4">You might also like</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {similarMovies.map(similar => (
                    <div 
                      key={similar.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/movie/${similar.id}`)}
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-200">
                        {similar.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${similar.poster_path}`}
                            alt={similar.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">No poster</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-1 font-medium line-clamp-2">{similar.title}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Rate movie modal */}
      {showRateModal && movie && (
        <RateMovieModal
          tmdbMovie={movie}
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
        />
      )}
    </div>
  );
}