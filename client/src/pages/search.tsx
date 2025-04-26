import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMovieApi } from "@/hooks/useMovies";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, X, Clock } from "lucide-react";
import AddMovieModal from "@/components/movies/AddMovieModal";
import { TMDBMovie } from "@/types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Set document title
  useEffect(() => {
    document.title = "Search | MovieDiary";
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);
  
  // Debounce search query
  useEffect(() => {
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
  }, [query, recentSearches]);
  
  const { searchMovies } = useMovieApi();
  
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-movies", debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 0
  });
  
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };
  
  const handleSelectMovie = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setShowAddModal(true);
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
        {debouncedQuery === "" ? (
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
                <div className="bg-gradient-to-r from-primary to-blue-400 text-white rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Action</h4>
                  <p className="text-xs text-white text-opacity-80">738 movies</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Comedy</h4>
                  <p className="text-xs text-white text-opacity-80">892 movies</p>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Sci-Fi</h4>
                  <p className="text-xs text-white text-opacity-80">421 movies</p>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Drama</h4>
                  <p className="text-xs text-white text-opacity-80">1,243 movies</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Search Results
          <div>
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
            ) : searchResults && searchResults.length > 0 ? (
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
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SearchIcon className="text-gray-400 h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No movies found</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Try searching for another title, or check your spelling
                  </p>
                </CardContent>
              </Card>
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
