import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMovieApi } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TMDBMovie, TMDBGenre } from "@/types";
import { useLocation } from "wouter";
import { GENRES } from "@/lib/tmdb";
import { ChevronLeft, Film, Grid, List } from "lucide-react";
import AddMovieModal from "@/components/movies/AddMovieModal";

export default function GenrePage() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [genreId, setGenreId] = useState<number | null>(null);
  const [genreName, setGenreName] = useState("Movies");
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get URL parameters to extract genre ID
  useEffect(() => {
    const urlParams = new URLSearchParams(
      location.includes('?') ? location.split('?')[1] : ''
    );
    const genreParam = urlParams.get('id');
    if (genreParam) {
      const id = parseInt(genreParam);
      setGenreId(id);
      console.log("Genre ID set:", id);
    } else {
      console.log("No genre ID found in URL");
    }
  }, [location]);
  
  // Update genre name when genreId changes
  useEffect(() => {
    if (genreId) {
      console.log("Setting genre name for ID:", genreId);
      // Extract genre name from ID
      let newGenreName = "Movies";
      switch (genreId) {
        case GENRES.ACTION:
          newGenreName = "Action";
          break;
        case GENRES.ADVENTURE:
          newGenreName = "Adventure";
          break;
        case GENRES.ANIMATION:
          newGenreName = "Animation";
          break;
        case GENRES.COMEDY:
          newGenreName = "Comedy";
          break;
        case GENRES.CRIME:
          newGenreName = "Crime";
          break;
        case GENRES.DOCUMENTARY:
          newGenreName = "Documentary";
          break;
        case GENRES.DRAMA:
          newGenreName = "Drama";
          break;
        case GENRES.FAMILY:
          newGenreName = "Family";
          break;
        case GENRES.FANTASY:
          newGenreName = "Fantasy";
          break;
        case GENRES.HISTORY:
          newGenreName = "History";
          break;
        case GENRES.HORROR:
          newGenreName = "Horror";
          break;
        case GENRES.MUSIC:
          newGenreName = "Music";
          break;
        case GENRES.MYSTERY:
          newGenreName = "Mystery";
          break;
        case GENRES.ROMANCE:
          newGenreName = "Romance";
          break;
        case GENRES.SCIENCE_FICTION:
          newGenreName = "Science Fiction";
          break;
        case GENRES.THRILLER:
          newGenreName = "Thriller";
          break;
        case GENRES.WAR:
          newGenreName = "War";
          break;
        case GENRES.WESTERN:
          newGenreName = "Western";
          break;
      }
      
      setGenreName(newGenreName);
      document.title = `${newGenreName} Movies | Reelytics`;
    }
  }, [genreId]);

  const { getMoviesByGenre } = useMovieApi();

  // Fetch movies by genre
  const { data: movies, isLoading } = useQuery({
    queryKey: ["genre-movies", genreId],
    queryFn: () => getMoviesByGenre(genreId!),
    enabled: !!genreId,
  });

  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setShowAddModal(true);
  };

  if (!genreId) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Category Not Found</h2>
        <p className="mb-4">This genre category does not exist or was not properly specified.</p>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
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
            <h1 className="text-xl font-semibold dark:text-white">{genreName} Movies</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 rounded-md ${layout === 'grid' ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500'}`}
            onClick={() => setLayout('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 rounded-md ${layout === 'list' ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500'}`}
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
                      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '/placeholder.png'}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium line-clamp-1 dark:text-white">{movie.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="flex items-start p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
                        <h3 className="font-medium text-sm dark:text-white">{movie.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                        </p>
                        {movie.overview && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{movie.overview}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Film className="text-gray-400 dark:text-gray-500 h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1 dark:text-white">No movies found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  We couldn't find any movies in this category. Please try a different genre.
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