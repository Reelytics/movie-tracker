import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { WatchedMovieWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovieApi } from "@/hooks/useMovies";
import MovieGrid from "@/components/movies/MovieGrid";

export default function Home() {
  // Set document title
  useEffect(() => {
    document.title = "Home | MovieDiary";
  }, []);

  // Fetch watched movies
  const { data: watchedMovies, isLoading: loadingMovies } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/watched"]
  });

  // Get trending movies from TMDB
  const { getTrendingMovies, isLoading: loadingTrending } = useMovieApi();
  const { data: trendingMovies } = useQuery({
    queryKey: ["trending-movies"],
    queryFn: getTrendingMovies
  });

  if (loadingMovies && loadingTrending) {
    return (
      <div className="animate-pulse p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-48 mt-6" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Recently Watched</h2>
        {watchedMovies && watchedMovies.length > 0 ? (
          <MovieGrid
            movies={watchedMovies.slice(0, 6)}
            isLoading={loadingMovies}
            layout="grid"
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">You haven't watched any movies yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Add movies to your watched list to see them here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Trending Movies</h2>
        {trendingMovies && trendingMovies.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {trendingMovies.slice(0, 6).map((movie) => (
              <div key={movie.id} className="relative rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-[2/3] bg-gray-200">
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '/placeholder.png'}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Unable to load trending movies.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
