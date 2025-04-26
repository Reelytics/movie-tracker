import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WatchedMovieWithDetails } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MovieGrid from "@/components/movies/MovieGrid";

export default function Library() {
  // Set document title
  useEffect(() => {
    document.title = "Library | MovieDiary";
  }, []);

  // Fetch watched movies
  const { data: watchedMovies, isLoading: loadingMovies } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/watched"]
  });

  // Fetch favorite movies
  const { data: favoriteMovies, isLoading: loadingFavorites } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/favorites"]
  });

  if (loadingMovies && loadingFavorites) {
    return (
      <div className="animate-pulse p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const highlyRated = watchedMovies
    ? [...watchedMovies].filter(movie => movie.rating && movie.rating >= 4)
    : [];

  const recentlyAdded = watchedMovies
    ? [...watchedMovies].sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
    : [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">My Library</h1>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-gray-100 p-1 rounded-full mb-4">
          <TabsTrigger 
            value="all" 
            className="flex-1 py-1.5 data-[state=active]:bg-white data-[state=active]:text-primary rounded-full"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="favorites" 
            className="flex-1 py-1.5 data-[state=active]:bg-white data-[state=active]:text-primary rounded-full"
          >
            Favorites
          </TabsTrigger>
          <TabsTrigger 
            value="recent" 
            className="flex-1 py-1.5 data-[state=active]:bg-white data-[state=active]:text-primary rounded-full"
          >
            Recent
          </TabsTrigger>
          <TabsTrigger 
            value="top-rated" 
            className="flex-1 py-1.5 data-[state=active]:bg-white data-[state=active]:text-primary rounded-full"
          >
            Top Rated
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-2">
          {watchedMovies && watchedMovies.length > 0 ? (
            <MovieGrid
              movies={watchedMovies}
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
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-2">
          {favoriteMovies && favoriteMovies.length > 0 ? (
            <MovieGrid
              movies={favoriteMovies}
              isLoading={loadingFavorites}
              layout="grid"
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">You haven't added any favorites yet.</p>
                <p className="text-gray-500 text-sm mt-2">
                  Mark movies as favorites to see them here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-2">
          {recentlyAdded.length > 0 ? (
            <MovieGrid
              movies={recentlyAdded}
              isLoading={loadingMovies}
              layout="grid"
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">You haven't watched any movies recently.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="top-rated" className="mt-2">
          {highlyRated.length > 0 ? (
            <MovieGrid
              movies={highlyRated}
              isLoading={loadingMovies}
              layout="grid"
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">You haven't rated any movies highly yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
