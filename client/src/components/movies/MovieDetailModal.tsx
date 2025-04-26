import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { WatchedMovieWithDetails } from "@shared/schema";
import { X, Bookmark, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Rating from "@/components/ui/rating";
import RateMovieModal from "./RateMovieModal";
import { useMovieApi } from "@/hooks/useMovies";
import { useQuery } from "@tanstack/react-query";

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
  
  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        "PATCH", 
        `/api/movies/watched/${watchedMovie.id}`, 
        { favorite: !watchedMovie.favorite }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/favorites"] });
      toast({
        title: watchedMovie.favorite ? "Removed from favorites" : "Added to favorites",
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="bg-white w-full max-w-md mx-auto rounded-t-xl h-[85vh] overflow-hidden">
                  <div className="relative">
                    {/* Modal Header with poster */}
                    <div className="h-64 bg-gray-200 relative">
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
                        className="absolute top-4 right-4 bg-black/50 text-white rounded-full w-8 h-8"
                        onClick={onClose}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {/* Movie title and year */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-2xl font-bold">{watchedMovie.movie.title}</h3>
                        <div className="flex items-center text-gray-300 text-sm">
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
                    <div className="p-4 h-[calc(85vh-16rem)] overflow-y-auto">
                      {/* Actions bar */}
                      <div className="flex mb-4 border-b border-gray-200 pb-4">
                        <Button 
                          variant="ghost" 
                          className="flex-1 flex flex-col items-center justify-center py-2" 
                          onClick={() => setShowRateModal(true)}
                        >
                          <div className="mb-1">
                            <Rating value={watchedMovie.rating || 0} readOnly />
                          </div>
                          <span className="text-xs">Rate</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 flex flex-col items-center justify-center py-2"
                        >
                          <Bookmark className="h-5 w-5 mb-1" />
                          <span className="text-xs">Watchlist</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 flex flex-col items-center justify-center py-2"
                          onClick={() => toggleFavoriteMutation.mutate()}
                          disabled={toggleFavoriteMutation.isPending}
                        >
                          <Heart 
                            className={`h-5 w-5 mb-1 ${watchedMovie.favorite ? "fill-red-500 text-red-500" : ""}`} 
                          />
                          <span className="text-xs">Favorite</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 flex flex-col items-center justify-center py-2"
                        >
                          <Share className="h-5 w-5 mb-1" />
                          <span className="text-xs">Share</span>
                        </Button>
                      </div>
                      
                      {/* Genres */}
                      {movieDetails && movieDetails.genres && (
                        <div className="flex flex-wrap gap-2 mb-4">
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
                        <h4 className="text-lg font-semibold mb-2">Overview</h4>
                        <p className="text-gray-700 text-sm">
                          {watchedMovie.movie.overview || "No overview available."}
                        </p>
                      </div>
                      
                      {/* Cast */}
                      {movieDetails && movieDetails.cast && movieDetails.cast.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">Cast</h4>
                          <div className="flex space-x-3 overflow-x-auto pb-2">
                            {movieDetails.cast.slice(0, 10).map((person) => (
                              <div key={person.id} className="flex flex-col items-center w-16 flex-shrink-0">
                                <div className="w-16 h-16 rounded-full overflow-hidden mb-1 bg-gray-200">
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
                      
                      {/* Your Review */}
                      {watchedMovie.review && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">Your Review</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <Rating value={watchedMovie.rating || 0} readOnly />
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
                      
                      {/* Similar Movies */}
                      {similarMovies && similarMovies.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Similar Movies</h4>
                          <div className="flex space-x-3 overflow-x-auto pb-4">
                            {similarMovies.slice(0, 10).map((movie) => (
                              <div key={movie.id} className="w-24 flex-shrink-0">
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
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
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
