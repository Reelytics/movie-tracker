import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RatingCircle from "./RatingCircle";

interface MovieSearchResult {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
}

interface SearchResponse {
  results: MovieSearchResult[];
  page: number;
  totalPages: number;
  totalResults: number;
}

interface MovieSearchResultsProps {
  query: string;
  isActive: boolean;
}

export default function MovieSearchResults({ query, isActive }: MovieSearchResultsProps) {
  const [page, setPage] = useState(1);
  
  // Only fetch when there's a query and the component is active
  const { data, error, isLoading } = useQuery({
    queryKey: ['/api/tmdb/search', query, page],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`);
      if (!res.ok) {
        throw new Error('Failed to search movies');
      }
      return res.json();
    },
    enabled: Boolean(query) && isActive,
  });

  const searchResults = data as SearchResponse;
  
  if (!isActive) return null;
  
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-muted-foreground">Searching for "{query}"...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-10 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
        <p className="mt-2">Failed to search movies. Please try again.</p>
      </div>
    );
  }
  
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="mb-2">No results found for "{query}"</p>
        <p className="text-sm text-muted-foreground">Try a different search term or check your spelling</p>
      </div>
    );
  }
  
  return (
    <div className="py-4">
      <p className="mb-4 text-sm text-muted-foreground">
        {searchResults.totalResults} results found for "{query}"
      </p>
      
      <div className="space-y-4">
        {searchResults.results.map((movie) => (
          <div key={movie.tmdbId} className="flex bg-card rounded-lg overflow-hidden">
            {movie.posterUrl ? (
              <div className="w-24 h-36 overflow-hidden">
                <img 
                  src={movie.posterUrl} 
                  alt={`${movie.title} poster`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-36 bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">No poster</span>
              </div>
            )}
            
            <div className="flex-1 p-3 flex flex-col overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-base truncate">{movie.title}</h3>
                  <p className="text-xs text-muted-foreground">{movie.year}</p>
                </div>
                
                <Link href={`/movie/add/${movie.tmdbId}`}>
                  <Button size="sm" variant="default">Add</Button>
                </Link>
              </div>
              
              {movie.overview && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {searchResults.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          
          <span className="text-sm">
            Page {page} of {searchResults.totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === searchResults.totalPages}
            onClick={() => setPage(p => Math.min(searchResults.totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}