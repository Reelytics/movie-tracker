import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WatchedMovieWithDetails } from "@shared/schema";
import { TMDBMovie } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Rating from "@/components/ui/rating";

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
  
  // Add or update movie rating
  const rateMutation = useMutation({
    mutationFn: async () => {
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
        
        return apiRequest("POST", "/api/movies", movieData);
      } else if (watchedMovie) {
        // Update existing watched movie
        return apiRequest(
          "PATCH", 
          `/api/movies/watched/${watchedMovie.id}`, 
          {
            rating,
            review: review.trim() ? review : null,
            watchedAt: new Date(watchDate).toISOString(),
          }
        );
      }
      
      throw new Error("Invalid movie data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      toast({
        title: isNewMovie ? "Movie added to your watched list" : "Rating updated",
        duration: 2000
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error saving rating",
        description: error.message,
        variant: "destructive"
      });
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white w-full max-w-md mx-auto rounded-xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Rate & Review</h3>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5 text-gray-700" />
                  </Button>
                </div>
                
                {/* Movie Info */}
                <div className="px-4 py-3 flex items-center border-b border-gray-200">
                  <div className="w-10 h-15 rounded overflow-hidden">
                    <img 
                      src={getPosterUrl(posterPath)} 
                      alt={movieTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">{movieTitle}</h4>
                    <p className="text-xs text-gray-500">
                      {movieYear ? `${movieYear}` : "Unknown year"}
                    </p>
                  </div>
                </div>
                
                {/* Rating Section */}
                <div className="p-4 border-b border-gray-200">
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
                <div className="p-4 border-b border-gray-200">
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
                <div className="p-4 flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 bg-primary" 
                    onClick={handleSubmit}
                    disabled={rateMutation.isPending}
                  >
                    {rateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
