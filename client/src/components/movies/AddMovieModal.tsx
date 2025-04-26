import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TMDBMovie } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMovieApi } from "@/hooks/useMovies";
import { useQuery } from "@tanstack/react-query";
import RateMovieModal from "./RateMovieModal";
import { useLocation } from "wouter";

interface AddMovieModalProps {
  movie?: TMDBMovie;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMovieModal({ movie: initialMovie, isOpen, onClose }: AddMovieModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(initialMovie || null);
  const [showRateModal, setShowRateModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { searchMovies } = useMovieApi();
  const [, navigate] = useLocation();
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  // Search for movies
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-movies-modal", debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0
  });
  
  // Add movie to watched list
  const addToWatchedMutation = useMutation({
    mutationFn: async (tmdbMovie: TMDBMovie) => {
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
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error adding movie",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSelectMovie = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setShowRateModal(true);
  };
  
  const handleAddMovie = () => {
    if (selectedMovie) {
      addToWatchedMutation.mutate(selectedMovie);
    }
  };
  
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
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-white w-full h-full max-w-md transform overflow-hidden rounded-t-xl transition-all">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5 text-gray-700" />
                      </Button>
                      <h2 className="text-lg font-semibold">Add to Watched</h2>
                      <div className="w-6"></div>
                    </div>
                    
                    {/* Search bar, only show if no initial movie was provided */}
                    {!initialMovie && (
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center">
                          <Search className="text-gray-500 h-4 w-4 mr-2" />
                          <Input 
                            type="text" 
                            placeholder="Search for a movie..." 
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 pl-0"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Results */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {/* If we have an initial movie, show it */}
                      {initialMovie && (
                        <div className="flex items-center border border-gray-200 p-2 rounded-lg">
                          <div className="w-16 h-24 rounded overflow-hidden">
                            <img 
                              src={initialMovie.poster_path 
                                ? `https://image.tmdb.org/t/p/w200${initialMovie.poster_path}` 
                                : '/placeholder.png'
                              } 
                              alt={initialMovie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="font-medium">{initialMovie.title}</h4>
                            <p className="text-sm text-gray-500">
                              {initialMovie.release_date 
                                ? new Date(initialMovie.release_date).getFullYear() 
                                : "Unknown year"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {initialMovie.overview || "No description available"}
                            </p>
                          </div>
                          <div className="ml-2">
                            <Button variant="default" size="sm" onClick={handleAddMovie}>
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Loading state */}
                      {isLoading && (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center p-2 rounded-lg">
                              <Skeleton className="w-16 h-24 rounded" />
                              <div className="ml-3 flex-1">
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-40" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Search Results */}
                      {!initialMovie && !isLoading && searchResults && searchResults.length > 0 && (
                        <div className="space-y-3">
                          {searchResults.map((movie) => (
                            <div 
                              key={movie.id} 
                              className="flex items-center border border-gray-200 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={() => navigate(`/movie/${movie.id}`)}
                            >
                              <div className="w-16 h-24 rounded overflow-hidden">
                                <img 
                                  src={movie.poster_path 
                                    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` 
                                    : '/placeholder.png'
                                  } 
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <h4 className="font-medium">{movie.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {movie.release_date 
                                    ? new Date(movie.release_date).getFullYear() 
                                    : "Unknown year"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                  {movie.overview || "No description available"}
                                </p>
                              </div>
                              <div className="ml-2">
                                <div className="w-6 h-6 rounded-full border border-gray-300"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty state */}
                      {!initialMovie && !isLoading && debouncedQuery && (!searchResults || searchResults.length === 0) && (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-400 h-10 w-10" />
                          </div>
                          <h3 className="text-lg font-semibold mb-1">No movies found</h3>
                          <p className="text-sm text-gray-500 max-w-xs">
                            Try searching for another title, or check your spelling
                          </p>
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
      
      {/* Rate movie modal */}
      {showRateModal && selectedMovie && (
        <RateMovieModal
          tmdbMovie={selectedMovie}
          isOpen={showRateModal}
          onClose={() => {
            setShowRateModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
