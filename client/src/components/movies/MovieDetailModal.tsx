import { useState, useEffect } from "react";
import { WatchedMovieWithDetails } from "@shared/schema";
import { X, Bookmark, Heart, Share, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import RateMovieModal from "./RateMovieModal";
import { useMovieApi } from "@/hooks/useMovies";
import { useQuery } from "@tanstack/react-query";
import * as Drawer from "vaul";

interface MovieDetailModalProps {
  watchedMovie: WatchedMovieWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieDetailModal({ watchedMovie, isOpen, onClose }: MovieDetailModalProps) {
  const [showRateModal, setShowRateModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getMovieDetails, getSimilarMovies } = useMovieApi();
  
  // Get movie details from TMDB
  const { data: movieDetails } = useQuery({
    queryKey: ["movie-details", watchedMovie.movie.tmdbId],
    queryFn: () => getMovieDetails(watchedMovie.movie.tmdbId)
  });

  // Get similar movies
  const { data: similarMovies } = useQuery({
    queryKey: ["similar-movies", watchedMovie.movie.tmdbId],
    queryFn: () => getSimilarMovies(watchedMovie.movie.tmdbId)
  });
  
  const getTMDBImageUrl = (path: string | null, size = "w400") => {
    if (!path) return "/placeholder.png";
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };
  
  // State to track local favorite status
  const [isFavorite, setIsFavorite] = useState(watchedMovie.favorite);
  
  // Update local state when props change
  useEffect(() => {
    setIsFavorite(watchedMovie.favorite);
  }, [watchedMovie.favorite]);
  
  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        "PATCH", 
        `/api/movies/watched/${watchedMovie.id}`, 
        { favorite: !isFavorite }
      );
    },
    onMutate: async () => {
      // Optimistically update UI
      setIsFavorite(!isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        duration: 2000
      });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setIsFavorite(!isFavorite);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <>
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl flex flex-col bg-white max-h-[90vh]">
            <div className="flex flex-col">
              {/* Drawer handle */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-2 mb-2" />
              
              {/* Movie Header with poster */}
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={getTMDBImageUrl(watchedMovie.movie.backdropPath || watchedMovie.movie.posterPath, "w780")} 
                  alt={watchedMovie.movie.title}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                
                {/* Close button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-7 h-7"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {/* Movie title and year */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white text-xl font-bold">{watchedMovie.movie.title}</h3>
                  <div className="flex items-center text-gray-300 text-xs">
                    <span>{watchedMovie.movie.releaseYear}</span>
                    {movieDetails && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{movieDetails.runtime} min</span>
                        <span className="mx-1">•</span>
                        <span>{movieDetails.director}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Movie content */}
              <div className="px-4 pt-2 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 48px - 3.5rem)' }}>
                {/* Actions bar */}
                <div className="flex mb-4 border-b border-gray-200 pb-3">
                  <Button 
                    variant="ghost" 
                    className="flex-1 flex flex-col items-center justify-center py-1" 
                    onClick={() => setShowRateModal(true)}
                  >
                    <div className="mb-1 font-bold text-lg">
                      {watchedMovie.rating ? watchedMovie.rating.toFixed(1) : "-"}
                    </div>
                    <span className="text-xs">Rate</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 flex flex-col items-center justify-center py-1"
                  >
                    <Bookmark className="h-5 w-5 mb-1" />
                    <span className="text-xs">Watchlist</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 flex flex-col items-center justify-center py-1"
                    onClick={() => toggleFavoriteMutation.mutate()}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Heart 
                      className={`h-5 w-5 mb-1 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} 
                    />
                    <span className="text-xs">Favorite</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 flex flex-col items-center justify-center py-1"
                  >
                    <Share className="h-5 w-5 mb-1" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
                
                {/* Genres */}
                {movieDetails && movieDetails.genres && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {movieDetails.genres.map((genre) => (
                      <Badge 
                        key={genre.id} 
                        variant="secondary" 
                        className="bg-gray-100 text-gray-800 text-xs"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Overview */}
                <div className="mb-4">
                  <h4 className="text-base font-semibold mb-2">Overview</h4>
                  <p className="text-gray-700 text-sm">
                    {watchedMovie.movie.overview || "No overview available."}
                  </p>
                </div>
                
                {/* Your Review */}
                {watchedMovie.review && (
                  <div className="mb-4">
                    <h4 className="text-base font-semibold mb-2">Your Review</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="px-2 py-1 bg-gray-800 text-white rounded font-semibold text-sm">
                          {watchedMovie.rating ? watchedMovie.rating.toFixed(1) : "-"}/10
                        </div>
                        <span className="text-xs text-gray-500">
                          Watched on {format(new Date(watchedMovie.watchedAt), "MMMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {watchedMovie.review}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="link" 
                          className="text-primary text-xs font-medium p-0 h-auto"
                          onClick={() => setShowRateModal(true)}
                        >
                          Edit Review
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cast */}
                {movieDetails && movieDetails.cast && movieDetails.cast.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-semibold mb-2">Cast</h4>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {movieDetails.cast.slice(0, 10).map((person) => (
                        <div key={person.id} className="flex flex-col items-center w-14 flex-shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden mb-1 bg-gray-200">
                            <img 
                              src={person.profile_path 
                                ? `https://image.tmdb.org/t/p/w200${person.profile_path}` 
                                : '/placeholder-avatar.png'
                              } 
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs text-center line-clamp-2">{person.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Similar Movies */}
                {similarMovies && similarMovies.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold mb-2">Similar Movies</h4>
                    <div className="flex space-x-3 overflow-x-auto pb-4">
                      {similarMovies.slice(0, 10).map((movie) => (
                        <div key={movie.id} className="w-20 flex-shrink-0">
                          <div className="aspect-[2/3] rounded overflow-hidden mb-1 bg-gray-200">
                            <img 
                              src={movie.poster_path 
                                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` 
                                : '/placeholder.png'
                              } 
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs font-medium line-clamp-2">{movie.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      
      {showRateModal && (
        <RateMovieModal
          watchedMovie={watchedMovie}
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
        />
      )}
    </>
  );
}
