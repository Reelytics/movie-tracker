import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WatchedMovieWithDetails } from "@shared/schema";
import { TMDBMovie } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Rating from "@/components/ui/rating";
import { useAuth } from "@/hooks/useAuth";
import * as Drawer from "vaul";

interface RateMovieModalProps {
  watchedMovie?: WatchedMovieWithDetails;
  tmdbMovie?: TMDBMovie;
  isOpen: boolean;
  onClose: () => void;
}

export default function RateMovieModal({ 
  watchedMovie, 
  tmdbMovie, 
  isOpen, 
  onClose 
}: RateMovieModalProps) {
  const isNewMovie = !watchedMovie && !!tmdbMovie;
  const [rating, setRating] = useState<number>(watchedMovie?.rating || 0);
  const [review, setReview] = useState<string>(watchedMovie?.review || "");
  const [watchDate, setWatchDate] = useState<string>(
    watchedMovie 
      ? new Date(watchedMovie.watchedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Verify authentication status first
  useEffect(() => {
    if (isOpen && !user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to rate movies.",
        variant: "destructive",
        duration: 5000
      });
      onClose();
    }
  }, [isOpen, user, toast, onClose]);
  
  // Add or update movie rating
  const rateMutation = useMutation({
    mutationFn: async () => {
      // Double-check authentication
      if (!user) {
        throw new Error("You must be logged in to perform this action");
      }
      
      if (isNewMovie && tmdbMovie) {
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
          rating,
          review: review.trim() ? review : null,
          watchedAt: new Date(watchDate).toISOString(),
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
            if (response.status === 401) {
              throw new Error("Your session has expired. Please log in again.");
            }
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to save movie");
          }
          
          return await response.json();
        } catch (error) {
          console.error("Error saving movie:", error);
          throw error;
        }
      } else if (watchedMovie) {
        // Update existing watched movie
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
          
          const response = await fetch(`/api/movies/watched/${watchedMovie.id}`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
              rating,
              review: review.trim() ? review : null,
              watchedAt: new Date(watchDate).toISOString(),
            }),
            credentials: "include"
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Your session has expired. Please log in again.");
            }
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update movie");
          }
          
          return await response.json();
        } catch (error) {
          console.error("Error updating movie:", error);
          throw error;
        }
      }
      
      throw new Error("Invalid movie data");
    },
    onSuccess: () => {
      // Invalidate multiple related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      toast({
        title: isNewMovie ? "Movie added to your watched list" : "Rating updated",
        duration: 2000
      });
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Rating mutation error:", errorMessage);
      
      toast({
        title: "Error saving rating",
        description: errorMessage,
        variant: "destructive"
      });
      
      // If authentication error, suggest to log in again
      if (errorMessage.includes("session") || errorMessage.includes("logged in")) {
        setTimeout(() => {
          // Optionally redirect to login page
          window.location.href = "/auth";
        }, 2000);
      }
    }
  });
  
  const handleSubmit = () => {
    rateMutation.mutate();
  };
  
  // Get movie data from either source
  const movieTitle = watchedMovie?.movie.title || tmdbMovie?.title || "";
  const movieYear = watchedMovie?.movie.releaseYear || 
    (tmdbMovie?.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null);
  const posterPath = watchedMovie?.movie.posterPath || tmdbMovie?.poster_path || null;
  
  const getPosterUrl = (path: string | null) => {
    if (!path) return "/placeholder.png";
    return `https://image.tmdb.org/t/p/w200${path}`;
  };
  
  return (
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
              <h2 className="text-lg font-semibold">Rate & Review</h2>
              <div className="w-8"></div>
            </div>
            
            {/* Movie Info */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-14 h-20 rounded overflow-hidden">
                <img 
                  src={getPosterUrl(posterPath)} 
                  alt={movieTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="font-medium line-clamp-1">{movieTitle}</h4>
                <p className="text-sm text-gray-500">
                  {movieYear ? `${movieYear}` : "Unknown year"}
                </p>
              </div>
            </div>
            
            {/* Rating Section */}
            <div className="mb-5">
              <h4 className="text-center font-medium mb-4">Your Rating</h4>
              <div className="flex justify-center text-3xl mb-4">
                <Rating 
                  value={rating} 
                  onChange={setRating} 
                  size="lg" 
                />
              </div>
              
              {/* Watch Date */}
              <div className="mb-3">
                <Label htmlFor="watch-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Watch Date
                </Label>
                <Input 
                  id="watch-date"
                  type="date" 
                  className="w-full" 
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                />
              </div>
            </div>
            
            {/* Review Section */}
            <div className="mb-5">
              <Label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
                Your Review (Optional)
              </Label>
              <Textarea 
                id="review"
                placeholder="Share your thoughts about the movie..." 
                className="w-full h-24 resize-none"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col space-y-3 mt-6">
              <Button 
                variant="default" 
                className="w-full py-6" 
                onClick={handleSubmit}
                disabled={rateMutation.isPending}
              >
                {rateMutation.isPending ? "Saving..." : "Save Rating"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full py-4" 
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
