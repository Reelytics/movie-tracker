import { WatchedMovieWithDetails } from "@shared/schema";
import { useMovieDetailModal } from "@/hooks/useModal";
import { QuoteIcon } from "lucide-react";

interface MovieItemProps {
  watchedMovie: WatchedMovieWithDetails;
}

export default function MovieItem({ watchedMovie }: MovieItemProps) {
  const { openModal } = useMovieDetailModal();
  
  const handleClick = () => {
    openModal(watchedMovie);
  };
  
  const getTMDBImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.png";
    return `https://image.tmdb.org/t/p/w400${path}`;
  };
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden shadow-sm cursor-pointer" 
      onClick={handleClick}
    >
      <div className="aspect-[2/3] bg-gray-200">
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
    </div>
  );
}
