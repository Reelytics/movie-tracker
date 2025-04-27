import { WatchedMovieWithDetails } from "@shared/schema";
import { useMovieDetailModal } from "@/hooks/useModal";

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
    </div>
  );
}
