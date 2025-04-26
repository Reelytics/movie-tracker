import { WatchedMovieWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import MovieItem from "./MovieItem";

interface MovieGridProps {
  movies: WatchedMovieWithDetails[];
  isLoading: boolean;
  layout: "grid" | "list";
}

export default function MovieGrid({ movies, isLoading, layout }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="px-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="relative">
              <Skeleton className="aspect-[2/3] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-gray-500">No movies found</p>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="px-2">
        <div className="flex flex-col gap-3">
          {movies.map((watchedMovie) => (
            <div 
              key={watchedMovie.id}
              className="flex items-center p-2 border-b border-gray-100"
            >
              <div className="mr-3 w-12">
                {watchedMovie.movie.posterPath ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w92${watchedMovie.movie.posterPath}`}
                    alt={watchedMovie.movie.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{watchedMovie.movie.title}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  <span>
                    {watchedMovie.watchedAt ? new Date(watchedMovie.watchedAt).getFullYear() : 'Unknown'}
                  </span>
                  {watchedMovie.rating && (
                    <span className="ml-2">★ {watchedMovie.rating}/5</span>
                  )}
                </div>
              </div>
              {watchedMovie.favorite && (
                <div className="ml-2 text-red-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="px-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {movies.map((watchedMovie) => (
          <MovieItem 
            key={watchedMovie.id} 
            watchedMovie={watchedMovie} 
          />
        ))}
      </div>
    </div>
  );
}
