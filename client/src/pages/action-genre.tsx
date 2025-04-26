import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMovieApi } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TMDBMovie } from "@/types";
import { useLocation } from "wouter";
import { GENRES } from "@/lib/tmdb";
import { ChevronLeft, Film, Grid, List } from "lucide-react";
import AddMovieModal from "@/components/movies/AddMovieModal";

export default function ActionGenrePage() {
  const [, navigate] = useLocation();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { getMoviesByGenre } = useMovieApi();

  // Fetch movies by Action genre
  const { data: movies, isLoading } = useQuery({
    queryKey: ["genre-movies", GENRES.ACTION],
    queryFn: () => getMoviesByGenre(GENRES.ACTION),
  });

  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setShowAddModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/search")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Film className="mr-2 h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Action Movies</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 rounded-md ${layout === 'grid' ? 'text-gray-600 bg-gray-100' : 'text-gray-400'}`}
            onClick={() => setLayout('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 rounded-md ${layout === 'list' ? 'text-gray-600 bg-gray-100' : 'text-gray-400'}`}
            onClick={() => setLayout('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          layout === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="rounded overflow-hidden">
                  <Skeleton className="aspect-[2/3] w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-3 w-2/3 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex p-2 rounded-lg">
                  <Skeleton className="w-16 h-24 rounded" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {movies && movies.length > 0 ? (
              layout === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3">
                  {movies.map((movie) => (
                    <div 
                      key={movie.id}
                      className="cursor-pointer rounded-lg overflow-hidden shadow-md"
                      onClick={() => handleMovieClick(movie)}
                    >
                      <div className="aspect-[2/3] bg-gray-200">
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '/placeholder.png'}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium line-clamp-1">{movie.title}</h3>
                        <p className="text-xs text-gray-500">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-start p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => handleMovieClick(movie)}
                    >
                      <div className="w-16 h-24 rounded overflow-hidden">
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/placeholder.png'}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-sm">{movie.title}</h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                        </p>
                        {movie.overview && (
                          <p className="text-xs text-gray-600 line-clamp-2">{movie.overview}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Film className="text-gray-400 h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No movies found</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  We couldn't find any action movies. Please try a different genre.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Movie add modal */}
      {selectedMovie && (
        <AddMovieModal
          movie={selectedMovie}
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}