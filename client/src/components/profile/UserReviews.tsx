import { WatchedMovieWithDetails } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FirstImpressions from "./FirstImpressions";

interface UserReviewsProps {
  watchedMovies: WatchedMovieWithDetails[];
  isLoading: boolean;
}

export default function UserReviews({ watchedMovies, isLoading }: UserReviewsProps) {
  // Filter movies that have reviews
  const moviesWithReviews = watchedMovies.filter(movie => movie.review);

  return (
    <Tabs defaultValue="first-impressions" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-full p-1 mb-4">
        <TabsTrigger 
          value="first-impressions" 
          className="rounded-full data-[state=active]:bg-white"
        >
          First Impressions
        </TabsTrigger>
        <TabsTrigger 
          value="full-reviews" 
          className="rounded-full data-[state=active]:bg-white"
        >
          Full Reviews
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="first-impressions" className="mt-0">
        <FirstImpressions watchedMovies={watchedMovies} isLoading={isLoading} />
      </TabsContent>
      
      <TabsContent value="full-reviews" className="mt-0">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4 bg-gray-50 rounded-lg p-4">
                <div className="rounded w-16 h-24 bg-gray-300"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : moviesWithReviews.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            No reviews written yet
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {moviesWithReviews.map(movie => (
              <div 
                key={movie.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-gray-100/50 border-b border-gray-200">
                  <div className="flex items-center">
                    <img 
                      src={movie.movie.posterPath 
                        ? `https://image.tmdb.org/t/p/w200${movie.movie.posterPath}` 
                        : '/placeholder.png'
                      } 
                      alt={movie.movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div className="ml-3">
                      <h3 className="font-medium text-sm">{movie.movie.title}</h3>
                    </div>
                  </div>
                  {movie.rating && (
                    <div className={`px-2 py-0.5 rounded-sm text-white text-xs font-bold ${
                      movie.rating >= 7 ? "bg-green-600" : 
                      movie.rating >= 4 ? "bg-amber-500" : 
                      "bg-red-500"
                    }`}>
                      {movie.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700">{movie.review}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}