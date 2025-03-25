import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { X, Calendar, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
}

interface MovieResponse {
  movie: {
    id: number;
    title: string;
    year: number;
    posterUrl?: string;
    backdropUrl?: string;
    overview?: string;
    runtime?: number;
    rating: number;
  };
  tmdbData: TMDBMovie;
}

export default function AddMovieDetails() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [theaterId, setTheaterId] = useState<number | undefined>(undefined);
  const [inTheater, setInTheater] = useState(true);
  
  // Extract the movie ID from URL
  const movieId = parseInt(window.location.pathname.split('/').pop() || "0");
  
  // Fetch movie details
  const { data, isLoading, error } = useQuery<MovieResponse>({
    queryKey: ['/api/tmdb/movie', movieId],
    enabled: !isNaN(movieId) && movieId > 0,
  });
  
  // Import movie mutation
  const importMutation = useMutation({
    mutationFn: async (tmdbId: number) => {
      const res = await apiRequest('POST', '/api/tmdb/import', { tmdbId });
      return res.json();
    },
    onSuccess: (data) => {
      // Add to watched data
      watchedMutation.mutate({
        userId: 1, // Hardcoded for now, would come from auth
        movieId: data.id,
        watchedDate,
        rating: rating > 0 ? rating : undefined,
        review: review.trim() || undefined,
        theaterId: inTheater ? theaterId : undefined
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import movie. Please try again.",
        variant: "destructive"
      });
      setIsAdding(false);
    }
  });
  
  // Add to watched mutation
  const watchedMutation = useMutation({
    mutationFn: async (watchedData: any) => {
      const res = await apiRequest('POST', '/api/watched', watchedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', 1, 'watched'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', 1, 'stats'] });
      
      toast({
        title: "Success!",
        description: "Movie added to your watched list",
        variant: "default"
      });
      
      navigate('/profile');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to watched. Please try again.",
        variant: "destructive"
      });
      setIsAdding(false);
    }
  });
  
  const handleAddMovie = () => {
    if (!data || !data.tmdbData) return;
    
    setIsAdding(true);
    importMutation.mutate(data.tmdbData.id);
  };
  
  const movieDetails = data?.tmdbData as TMDBMovie | undefined;
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link href="/search">
              <button className="text-muted-foreground">
                <X className="h-6 w-6" />
              </button>
            </Link>
            <h1 className="ml-4 text-lg font-medium">Loading movie...</h1>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading movie details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !movieDetails) {
    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link href="/search">
              <button className="text-muted-foreground">
                <X className="h-6 w-6" />
              </button>
            </Link>
            <h1 className="ml-4 text-lg font-medium">Error</h1>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="mt-4">Failed to load movie details</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/search')}
            >
              Go back to search
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Link href="/search">
            <button className="text-muted-foreground">
              <X className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="ml-4 text-lg font-medium truncate">{movieDetails.title}</h1>
        </div>
      </header>
      
      <main className="flex-1">
        {movieDetails.backdrop_path && (
          <div className="w-full h-48 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
            <img 
              src={`https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path}`}
              alt={`${movieDetails.title} backdrop`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-4 items-start">
            {movieDetails.poster_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w342${movieDetails.poster_path}`}
                alt={`${movieDetails.title} poster`}
                className="w-32 rounded-lg shadow-md"
              />
            ) : (
              <div className="w-32 h-48 bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground text-xs">No poster</span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{movieDetails.title}</h1>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {movieDetails.release_date && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>{new Date(movieDetails.release_date).getFullYear()}</span>
                  </div>
                )}
                
                {movieDetails.runtime && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m</span>
                  </div>
                )}
              </div>
              
              {movieDetails.genres && movieDetails.genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {movieDetails.genres.map(genre => (
                    <span 
                      key={genre.id} 
                      className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {movieDetails.overview && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-2">Overview</h2>
              <p className="text-muted-foreground">{movieDetails.overview}</p>
            </div>
          )}
          
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-medium">Add to your watched list</h2>
            
            <div>
              <Label htmlFor="watched-date">When did you watch it?</Label>
              <Input 
                id="watched-date" 
                type="date" 
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="theater-switch">Watched in theater?</Label>
                <Switch 
                  id="theater-switch" 
                  checked={inTheater}
                  onCheckedChange={setInTheater}
                />
              </div>
              
              {inTheater && (
                <div className="mt-2">
                  <Label htmlFor="theater">Theater</Label>
                  <select 
                    id="theater"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary/50 bg-card py-2 px-3 outline-none border border-input"
                    onChange={(e) => setTheaterId(parseInt(e.target.value))}
                  >
                    <option value="">Select a theater</option>
                    <option value="1">AMC</option>
                    <option value="2">Regal</option>
                    <option value="3">Cinemark</option>
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="rating">Your rating (optional)</Label>
              <div className="flex items-center mt-1">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-2 min-w-[40px] text-center">{rating > 0 ? rating : '-'}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="review">Your review (optional)</Label>
              <Textarea 
                id="review"
                placeholder="Write your thoughts about the movie..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddMovie}
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Add to watched
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}