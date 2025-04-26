import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TMDBMovie } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMovieApi } from "@/hooks/useMovies";
import { useQuery } from "@tanstack/react-query";
import RateMovieModal from "./RateMovieModal";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import * as Drawer from "vaul";

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
  const { user } = useAuth();
  
  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && !user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to add movies.",
        variant: "destructive",
        duration: 5000
      });
      onClose();
    }
  }, [isOpen, user, toast, onClose]);
  
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
      // Check authentication first
      if (!user) {
        throw new Error("You must be logged in to add movies");
      }
      
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
      
      try {
        // Get auth token from localStorage
        const savedUser = localStorage.getItem('reelytics_user');
        let authHeaders: HeadersInit = {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        };
        
        // Add custom auth header if we have user data in localStorage
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData && userData.id) {
            authHeaders["X-User-Id"] = userData.id.toString();
            authHeaders["X-User-Auth"] = "true";
          }
        }
        
        const response = await fetch("/api/movies", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(movieData),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Network error" }));
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error(errorData.message || "Failed to add movie");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error adding movie:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      toast({
        title: "Movie added to your watched list",
        duration: 2000
      });
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Add movie error:", errorMessage);
      
      toast({
        title: "Error adding movie",
        description: errorMessage,
        variant: "destructive"
      });
      
      // If authentication error, suggest to log in again
      if (errorMessage.includes("session") || errorMessage.includes("logged in")) {
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      }
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
      {/* Bottom Sheet Drawer using Vaul */}
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl flex flex-col bg-white">
            <div className="px-4 py-4 flex-1">
              {/* Drawer handle */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4 text-gray-700" />
                </Button>
                <h2 className="text-lg font-semibold">Add to Watched</h2>
                <div className="w-8"></div>
              </div>
              
              {/* Search bar, only show if no initial movie was provided */}
              {!initialMovie && (
                <div className="mb-4">
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
              <div className="overflow-y-auto max-h-[60vh]">
                {/* If we have an initial movie, show it */}
                {initialMovie && (
                  <div className="flex items-center border border-gray-200 p-3 rounded-lg mb-2">
                    <div className="w-14 h-20 rounded overflow-hidden">
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
                      <h4 className="font-medium line-clamp-1">{initialMovie.title}</h4>
                      <p className="text-sm text-gray-500">
                        {initialMovie.release_date 
                          ? new Date(initialMovie.release_date).getFullYear() 
                          : "Unknown year"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {initialMovie.overview || "No description available"}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Loading state */}
                {isLoading && (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center p-2 rounded-lg">
                        <Skeleton className="w-14 h-20 rounded" />
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
                        className="flex items-center border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                      >
                        <div className="w-14 h-20 rounded overflow-hidden">
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
                          <h4 className="font-medium line-clamp-1">{movie.title}</h4>
                          <p className="text-sm text-gray-500">
                            {movie.release_date 
                              ? new Date(movie.release_date).getFullYear() 
                              : "Unknown year"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {movie.overview || "No description available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Empty state */}
                {!initialMovie && !isLoading && debouncedQuery && (!searchResults || searchResults.length === 0) && (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="text-gray-400 h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No movies found</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Try searching for another title, or check your spelling
                    </p>
                  </div>
                )}
              </div>
              
              {/* Bottom action area */}
              {initialMovie && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="default" 
                    className="w-full py-6" 
                    onClick={handleAddMovie}
                    disabled={addToWatchedMutation.isPending}
                  >
                    {addToWatchedMutation.isPending ? "Adding..." : "Add to Watched"}
                  </Button>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      
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