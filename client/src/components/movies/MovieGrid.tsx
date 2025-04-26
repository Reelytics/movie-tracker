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
