import { useState, useEffect } from "react";
import { X, Calendar, Check, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WatchedMovieWithDetails } from "@shared/schema";
import { TMDBMovie } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import RatingSlider from "@/components/ui/rating-slider";
import { useAuth } from "@/hooks/useAuth";
import { useDebugMode } from "@/hooks/useDebugMode";
import * as Drawer from "vaul";
import { format } from "date-fns";

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
  const [firstImpressions, setFirstImpressions] = useState<string>(watchedMovie?.firstImpressions || "");
  const [watchDate, setWatchDate] = useState<string>(
    watchedMovie 
      ? new Date(watchedMovie.watchedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [isEditingWatchDate, setIsEditingWatchDate] = useState<boolean>(isNewMovie);
  const [firstImpressionsError, setFirstImpressionsError] = useState<string>("");
  
  const isDebugMode = useDebugMode();
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
          firstImpressions: firstImpressions.trim() ? firstImpressions : null,
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
          
          // Only include watchedAt if we're explicitly editing it
          const updatePayload: any = {
            rating,
            review: review.trim() ? review : null,
          };
          
          // Include firstImpressions if it's being edited
          if (firstImpressions.trim() !== (watchedMovie.firstImpressions || '')) {
            updatePayload.firstImpressions = firstImpressions.trim() ? firstImpressions : null;
          }
          
          // Only include watchedAt if we're editing it (for new movies or explicit edits)
          if (isNewMovie || isEditingWatchDate) {
            updatePayload.watchedAt = new Date(watchDate).toISOString();
          }
          
          const response = await fetch(`/api/movies/watched/${watchedMovie.id}`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify(updatePayload),
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
      
      // Force refetch current tab content
      queryClient.refetchQueries({ queryKey: ["/api/movies/watched"] });
      
      toast({
        title: isNewMovie ? "Movie added to your watched list" : "Rating updated",
        description: firstImpressions.trim() ? "First impressions saved!" : "",
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
    // For new movies, first impressions are mandatory
    if (isNewMovie && !firstImpressions.trim()) {
      setFirstImpressionsError("First impressions are required when adding a new movie");
      return;
    }
    
    setFirstImpressionsError("");
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
              <div className="mx-4 mb-6">
                <RatingSlider 
                  value={rating || 5} 
                  onChange={setRating} 
                />
              </div>
              
              {/* Watch Date */}
              <div className="mb-3">
                <Label htmlFor="watch-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Watch Date
                </Label>
                
                {/* For new movies or when editing date, show date picker */}
                {(isNewMovie || isEditingWatchDate) ? (
                  <Input 
                    id="watch-date"
                    type="date" 
                    className="w-full" 
                    value={watchDate}
                    onChange={(e) => setWatchDate(e.target.value)}
                  />
                ) : (
                  /* For existing movies, show formatted date with edit button */
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-100 p-2 rounded text-gray-700">
                      {format(new Date(watchDate), "MMMM d, yyyy")}
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 text-primary hover:text-primary-dark"
                      onClick={() => setIsEditingWatchDate(true)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                )}
                
                {/* If editing date, show save button */}
                {(!isNewMovie && isEditingWatchDate) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-green-600 border-green-600"
                    onClick={() => setIsEditingWatchDate(false)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Confirm Date
                  </Button>
                )}
              </div>
            </div>
            
            {/* First Impressions Section - Only show for new movies or if there's an existing value */}
            {(isNewMovie || watchedMovie?.firstImpressions) && (
              <div className="mb-5">
                <Label htmlFor="first-impressions" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  First Impressions
                  {isNewMovie && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea 
                  id="first-impressions"
                  placeholder="A few words will do..." 
                  className={`w-full h-16 resize-none ${firstImpressionsError ? 'border-red-500 focus:ring-red-500' : ''}`}
                  value={firstImpressions}
                  onChange={(e) => {
                    setFirstImpressions(e.target.value);
                    if (e.target.value.trim()) {
                      setFirstImpressionsError('');
                    }
                  }}
                />
                {firstImpressionsError && (
                  <p className="text-sm text-red-500 mt-1">{firstImpressionsError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Share your initial reaction to this movie in a few words.
                </p>
              </div>
            )}
            
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
            
            {/* Debug Information - Only visible when debug=true is in URL */}
            {isDebugMode && (
              <div className="mb-5 border border-amber-200 bg-amber-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Bug className="h-4 w-4 text-amber-600 mr-2" />
                  <h4 className="text-sm font-medium text-amber-800">Debug Information</h4>
                </div>
                <div className="text-xs font-mono bg-white p-2 rounded border border-amber-100 max-h-48 overflow-y-auto">
                  <p className="mb-1"><span className="font-semibold">Movie ID:</span> {watchedMovie?.id || 'New Movie'}</p>
                  <p className="mb-1"><span className="font-semibold">TMDB ID:</span> {watchedMovie?.movie.tmdbId || tmdbMovie?.id || 'N/A'}</p>
                  <p className="mb-1"><span className="font-semibold">Rating:</span> {rating}</p>
                  <p className="mb-1"><span className="font-semibold">Watch Date:</span> {watchDate}</p>
                  <p className="mb-1"><span className="font-semibold">First Impressions:</span> {firstImpressions || 'N/A'}</p>
                  <p className="mb-1"><span className="font-semibold">Review Length:</span> {review.length} characters</p>
                  <p className="mb-1"><span className="font-semibold">Is New Movie:</span> {isNewMovie ? 'Yes' : 'No'}</p>
                  <p className="mb-1"><span className="font-semibold">User ID:</span> {user?.id || 'Not logged in'}</p>
                </div>
              </div>
            )}
            
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
