import { WatchedMovieWithDetails } from "@shared/schema";
import { QuoteIcon } from "lucide-react";
import { format } from "date-fns";

interface FirstImpressionsProps {
  watchedMovies: WatchedMovieWithDetails[];
  isLoading: boolean;
}

export default function FirstImpressions({ watchedMovies, isLoading }: FirstImpressionsProps) {
  // Filter movies that have first impressions
  const moviesWithImpressions = watchedMovies.filter(movie => movie.firstImpressions);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="rounded w-16 h-24 bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {moviesWithImpressions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
          <QuoteIcon className="h-10 w-10 mb-2 text-gray-300 dark:text-gray-600" />
          <p>No first impressions shared yet</p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {moviesWithImpressions.map(movie => (
            <div 
              key={movie.id} 
              className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 rounded-lg overflow-hidden"
            >
              <div className="flex items-center p-3 bg-amber-100/50 dark:bg-amber-800/30 border-b border-amber-100 dark:border-amber-800/50">
                <img 
                  src={movie.movie.posterPath 
                    ? `https://image.tmdb.org/t/p/w200${movie.movie.posterPath}` 
                    : '/placeholder.png'
                  } 
                  alt={movie.movie.title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div className="ml-3">
                  <h3 className="font-medium text-sm dark:text-white">{movie.movie.title}</h3>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    {format(new Date(movie.watchedAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex">
                  <QuoteIcon className="h-4 w-4 text-amber-800 dark:text-amber-400 mr-2 flex-shrink-0 mt-1" />
                  <p className="text-sm text-amber-900 dark:text-amber-200 italic">
                    "{movie.firstImpressions}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}