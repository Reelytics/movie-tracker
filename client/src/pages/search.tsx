import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMovieApi } from "@/hooks/useMovies";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, X, Clock, Film } from "lucide-react";
import AddMovieModal from "@/components/movies/AddMovieModal";
import { TMDBMovie, TMDBGenre } from "@/types";
import { useLocation } from "wouter";
import { GENRES } from "@/lib/tmdb";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [genreName, setGenreName] = useState<string>("");
  
  // Get URL parameters to check for genre filter
  const [location] = useLocation();
  
  // Set document title
  useEffect(() => {
    document.title = "Search | Reelytics";
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
    
    // Check if we have a genre parameter in the URL
    const urlParams = new URLSearchParams(
      location.includes('?') ? location.split('?')[1] : ''
    );
    const genreParam = urlParams.get('genre');
    
    if (genreParam) {
      // Redirect to the new genre page
      console.log("Redirecting to genre page with ID:", genreParam);
      navigate(`/genre?id=${genreParam.toString()}`);
    }
  }, [location]);
  
  // Debounce search query
  useEffect(() => {
    // If genre is selected, don't use search query
    if (selectedGenreId) return;
    
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      
      // Add to recent searches if query is not empty
      if (query.trim() && !recentSearches.includes(query.trim())) {
        const updatedSearches = [query.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, recentSearches, selectedGenreId]);
  
  const { searchMovies, getMoviesByGenre } = useMovieApi();
  
  // Query for text search
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["search-movies", debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0 && !selectedGenreId
  });
  
  // Query for genre search
  const { data: genreResults, isLoading: isLoadingGenre } = useQuery({
    queryKey: ["genre-movies", selectedGenreId],
    queryFn: () => getMoviesByGenre(selectedGenreId!),
    enabled: !!selectedGenreId
  });
  
  // Combined loading state
  const isLoading = isLoadingSearch || isLoadingGenre;
  
  // Get genre-specific movies for category previews
  const { data: actionMovies } = useQuery({
    queryKey: ["genre-preview", GENRES.ACTION],
    queryFn: () => getMoviesByGenre(GENRES.ACTION)
  });
  
  const { data: comedyMovies } = useQuery({
    queryKey: ["genre-preview", GENRES.COMEDY],
    queryFn: () => getMoviesByGenre(GENRES.COMEDY)
  });
  
  const { data: sciFiMovies } = useQuery({
    queryKey: ["genre-preview", GENRES.SCIENCE_FICTION],
    queryFn: () => getMoviesByGenre(GENRES.SCIENCE_FICTION)
  });
  
  const { data: horrorMovies } = useQuery({
    queryKey: ["genre-preview", GENRES.HORROR],
    queryFn: () => getMoviesByGenre(GENRES.HORROR)
  });
  
  // Function to get random movie from a genre that has a backdrop
  const getRandomGenreMovie = (movies: TMDBMovie[] | undefined): TMDBMovie | null => {
    if (!movies || movies.length === 0) return null;
    
    // Filter movies that have backdrop images
    const moviesWithBackdrops = movies.filter(movie => movie.backdrop_path);
    if (moviesWithBackdrops.length === 0) return null;
    
    // Return random movie with backdrop
    return moviesWithBackdrops[Math.floor(Math.random() * moviesWithBackdrops.length)];
  };
  
  // Get random movies for each genre category
  const randomActionMovie = getRandomGenreMovie(actionMovies);
  const randomComedyMovie = getRandomGenreMovie(comedyMovies);
  const randomSciFiMovie = getRandomGenreMovie(sciFiMovies);
  const randomHorrorMovie = getRandomGenreMovie(horrorMovies);
  
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };
  
  const [, navigate] = useLocation();

  const handleSelectMovie = (movie: TMDBMovie) => {
    navigate(`/movie/${movie.id}`);
  };
  
  const handleRecenSearch = (term: string) => {
    setQuery(term);
  };
  
  const removeRecentSearch = (term: string) => {
    const updatedSearches = recentSearches.filter(item => item !== term);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center">
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
          <SearchIcon className="text-gray-500 h-4 w-4 mr-2" />
          <Input 
            type="text" 
            placeholder="Search movies..." 
            className="bg-transparent border-none shadow-none focus-visible:ring-0 pl-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {debouncedQuery === "" && !selectedGenreId ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary text-xs p-0 h-auto" 
                    onClick={clearRecentSearches}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        className="flex items-center text-sm font-normal justify-start p-2"
                        onClick={() => handleRecenSearch(search)}
                      >
                        <Clock className="text-gray-400 h-4 w-4 mr-3" />
                        <span>{search}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400" 
                        onClick={() => removeRecentSearch(search)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Popular categories */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Browse Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Action Category */}
                <div 
                  className="relative h-28 rounded-lg overflow-hidden cursor-pointer shadow-md"
                  onClick={() => navigate(`/genre?id=${GENRES.ACTION.toString()}`)}
                >
                  {randomActionMovie && randomActionMovie.backdrop_path ? (
                    <>
                      <img 
                        src={`https://image.tmdb.org/t/p/w780${randomActionMovie.backdrop_path}`}
                        alt="Action" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary to-blue-400"></div>
                  )}
                  <div className="absolute bottom-2 left-3 text-white font-semibold">
                    <h4 className="font-semibold mb-1">Action</h4>
                    <p className="text-xs text-white text-opacity-80">Explore action movies</p>
                  </div>
                </div>
                
                {/* Comedy Category */}
                <div 
                  className="relative h-28 rounded-lg overflow-hidden cursor-pointer shadow-md"
                  onClick={() => navigate(`/genre?id=${GENRES.COMEDY.toString()}`)}
                >
                  {randomComedyMovie && randomComedyMovie.backdrop_path ? (
                    <>
                      <img 
                        src={`https://image.tmdb.org/t/p/w780${randomComedyMovie.backdrop_path}`}
                        alt="Comedy" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-pink-500 to-pink-400"></div>
                  )}
                  <div className="absolute bottom-2 left-3 text-white font-semibold">
                    <h4 className="font-semibold mb-1">Comedy</h4>
                    <p className="text-xs text-white text-opacity-80">Explore comedy movies</p>
                  </div>
                </div>
                
                {/* Science Fiction Category */}
                <div 
                  className="relative h-28 rounded-lg overflow-hidden cursor-pointer shadow-md"
                  onClick={() => navigate(`/genre?id=${GENRES.SCIENCE_FICTION.toString()}`)}
                >
                  {randomSciFiMovie && randomSciFiMovie.backdrop_path ? (
                    <>
                      <img 
                        src={`https://image.tmdb.org/t/p/w780${randomSciFiMovie.backdrop_path}`}
                        alt="Science Fiction" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
                  )}
                  <div className="absolute bottom-2 left-3 text-white font-semibold">
                    <h4 className="font-semibold mb-1">Science Fiction</h4>
                    <p className="text-xs text-white text-opacity-80">Explore sci-fi movies</p>
                  </div>
                </div>
                
                {/* Horror Category */}
                <div 
                  className="relative h-28 rounded-lg overflow-hidden cursor-pointer shadow-md"
                  onClick={() => navigate(`/genre?id=${GENRES.HORROR.toString()}`)}
                >
                  {randomHorrorMovie && randomHorrorMovie.backdrop_path ? (
                    <>
                      <img 
                        src={`https://image.tmdb.org/t/p/w780${randomHorrorMovie.backdrop_path}`}
                        alt="Horror" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-600 to-purple-400"></div>
                  )}
                  <div className="absolute bottom-2 left-3 text-white font-semibold">
                    <h4 className="font-semibold mb-1">Horror</h4>
                    <p className="text-xs text-white text-opacity-80">Explore horror movies</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Search Results or Genre Results
          <div>
            {/* Genre heading for genre search */}
            {selectedGenreId && (
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center">
                  <Film className="mr-2 h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{genreName} Movies</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setSelectedGenreId(null);
                    setGenreName("");
                    navigate("/search");
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
            )}
            
            {isLoading ? (
              // Loading state
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center p-2 rounded-lg">
                    <Skeleton className="w-16 h-24 rounded" />
                    <div className="ml-3 flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Display normal search results */}
                {!selectedGenreId && searchResults && searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((movie) => (
                      <Button
                        key={movie.id}
                        variant="outline"
                        className="flex items-center w-full h-auto p-2 border-gray-200 rounded-lg justify-start"
                        onClick={() => handleSelectMovie(movie)}
                      >
                        <div className="w-16 h-24 rounded overflow-hidden">
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/placeholder.png'}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-1 text-left">
                          <h4 className="font-medium">{movie.title}</h4>
                          <p className="text-sm text-gray-500">
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : "Unknown year"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {movie.overview || "No description available"}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Display genre search results */}
                {selectedGenreId && genreResults && genreResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {genreResults.map((movie) => (
                      <div 
                        key={movie.id}
                        className="cursor-pointer rounded-lg overflow-hidden shadow-md"
                        onClick={() => handleSelectMovie(movie)}
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
                )}
                
                {/* No results state */}
                {((selectedGenreId && (!genreResults || genreResults.length === 0)) || 
                  (!selectedGenreId && (!searchResults || searchResults.length === 0))) && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <SearchIcon className="text-gray-400 h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No movies found</h3>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        {selectedGenreId 
                          ? `No ${genreName.toLowerCase()} movies found. Try another category.`
                          : "Try searching for another title, or check your spelling"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Add Movie Modal */}
      {selectedMovie && (
        <AddMovieModal
          movie={selectedMovie}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
