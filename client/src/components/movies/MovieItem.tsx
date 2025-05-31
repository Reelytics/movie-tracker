import { WatchedMovieWithDetails } from "@shared/schema";
import { useMovieDetailModal } from "@/hooks/useModal";
import { QuoteIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { movieService } from "@/lib/movieService";
import { useQueryClient } from "@tanstack/react-query";

interface MovieItemProps {
  watchedMovie: WatchedMovieWithDetails;
  onRemove?: (id: number) => void;
}

export default function MovieItem({ watchedMovie, onRemove }: MovieItemProps) {
  const { openModal } = useMovieDetailModal();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);
  const queryClient = useQueryClient();
  
  const handleClick = () => {
    openModal(watchedMovie);
  };
  
  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the movie detail modal
    
    if (isRemoving) return; // Prevent multiple clicks
    
    try {
      setIsRemoving(true);
      
      await movieService.removeMovie(watchedMovie.id);
      
      // Invalidate all relevant queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      
      // Also invalidate any specific user queries that might be affected
      const userId = watchedMovie.userId; // Assuming userId is accessible
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "movies/watched"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "movies/favorites"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      }
      
      toast({
        title: "Removed",
        description: `Removed ${watchedMovie.movie.title} from your watched list`,
        duration: 3000,
      });
      
      // Notify parent component to update the UI
      if (onRemove) {
        onRemove(watchedMovie.id);
      }
    } catch (error) {
      console.error("Error removing movie:", error);
      toast({
        title: "Error",
        description: "Failed to remove the movie. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRemoving(false);
    }
  };
  
  const getTMDBImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.png";
    return `https://image.tmdb.org/t/p/w400${path}`;
  };
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden shadow-sm cursor-pointer group" 
      onClick={handleClick}
    >
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700">
        <img 
          src={getTMDBImageUrl(watchedMovie.movie.posterPath)} 
          alt={watchedMovie.movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {watchedMovie.rating && (
        <div className={`absolute top-1 right-1 px-2 py-0.5 rounded-sm text-white text-xs font-bold ${
          watchedMovie.rating >= 7 ? "bg-green-600" : 
          watchedMovie.rating >= 4 ? "bg-amber-500" : 
          "bg-red-500"
        }`}>
          {watchedMovie.rating.toFixed(1)}
        </div>
      )}
      
      {/* First Impressions badge */}
      {watchedMovie.firstImpressions && (
        <div className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 border border-amber-200">
          <QuoteIcon className="h-3.5 w-3.5 text-amber-800" />
        </div>
      )}
      
      {/* Remove button - visible on hover */}
      <button
        className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleRemove}
        disabled={isRemoving}
        title="Remove from watched list"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
