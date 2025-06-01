import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WatchedMovieWithDetails, UserProfile } from "@shared/schema";
import ProfileHeader from "@/components/profile/ProfileHeader";
import MovieGrid from "@/components/movies/MovieGrid";
import UserReviews from "@/components/profile/UserReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc, Grid, List, Ticket } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useDebugMode } from "@/hooks/useDebugMode";
import TicketScannerButton from "@/components/tickets/TicketScannerButton";

export default function Profile() {
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  const username = params.username;
  const { user: currentUser } = useAuth();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();
  const isDebugMode = useDebugMode();
  const [, navigate] = useLocation();
  
  // Add auth headers to any fetch
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
    
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData && userData.id) {
          headers["X-User-Id"] = userData.id.toString();
          headers["X-User-Auth"] = "true";
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
    
    return headers;
  };
  
  // Determine if we're looking at current user's profile or other user
  // First check if using ID path param
  const isCurrentUserById = !userId || (currentUser && userId === currentUser.id);
  // Then check if using username path param - if current user's username matches the param
  const isCurrentUserByUsername = username && currentUser && currentUser.username === username;
  // Combine checks
  const isCurrentUser = isCurrentUserById || isCurrentUserByUsername;
  
  // Fetch profile data - either current user or specified user by ID or username
  const { data: profile, isLoading: loadingProfile } = useQuery<UserProfile>({
    // If using username, use username query key
    queryKey: isCurrentUser 
      ? ["/api/users/current"] 
      : username 
        ? ["/api/users/username", username] 
        : ["/api/users", userId],
    queryFn: async ({ queryKey }) => {
      let url;
      if (isCurrentUser) {
        url = "/api/users/current";
      } else if (username) {
        url = `/api/users/username/${username}`;
      } else {
        url = `/api/users/${userId}`;
      }
        
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        credentials: "include",
        headers
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      return response.json();
    },
    enabled: !!(isCurrentUser || userId || username) // Only run if we have some way to identify the user
  });

  // Get the actual user ID from the profile for subsequent queries
  const profileUserId = profile?.user.id;

  // Fetch watched movies - either current user or specified user
  const { data: watchedMovies, isLoading: loadingMovies, refetch: refetchWatchedMovies } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: isCurrentUser ? ["/api/movies/watched"] : ["/api/users", profileUserId, "movies/watched"],
    queryFn: async ({ queryKey }) => {
      const url = isCurrentUser 
        ? "/api/movies/watched" 
        : `/api/users/${profileUserId}/movies/watched`;
        
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        credentials: "include",
        headers
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch watched movies");
      }
      
      return response.json();
    },
    enabled: !!profileUserId // Only run if we have the user ID from the profile
  });

  // Fetch favorite movies - either current user or specified user
  const { data: favoriteMovies, isLoading: loadingFavorites, refetch: refetchFavorites } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: isCurrentUser ? ["/api/movies/favorites"] : ["/api/users", profileUserId, "movies/favorites"],
    queryFn: async ({ queryKey }) => {
      const url = isCurrentUser 
        ? "/api/movies/favorites" 
        : `/api/users/${profileUserId}/movies/favorites`;
        
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        credentials: "include",
        headers
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch favorite movies");
      }
      
      return response.json();
    },
    enabled: !!profileUserId // Only run if we have the user ID from the profile
  });

  // Fetch tickets for current user
  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ["/api/tickets/tickets"],
    queryFn: async () => {
      const headers = getAuthHeaders();
      
      const response = await fetch("/api/tickets/tickets", {
        credentials: "include",
        headers
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      
      return response.json();
    },
    enabled: Boolean(isCurrentUser) // Only fetch tickets for the current user
  });

  // Set document title
  useEffect(() => {
    document.title = profile?.user.username 
      ? `${profile.user.username} | MovieDiary` 
      : "My Profile | MovieDiary";
  }, [profile]);
  
  // Handle movie removal
  const handleMovieRemoved = async (id: number) => {
    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ["/api/movies/watched"] });
    queryClient.invalidateQueries({ queryKey: ["/api/movies/favorites"] });
    
    // Invalidate specific user's watched movies and favorites
    if (profileUserId) {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId, "movies/watched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId, "movies/favorites"] });
    }
    
    // Also refresh profile to update stats
    if (profile) {
      queryClient.invalidateQueries({ queryKey: isCurrentUser ? ["/api/users/current"] : ["/api/users", profileUserId] });
    }
    
    // Force refetch to ensure fresh data
    refetchWatchedMovies();
    refetchFavorites();
  };

  if (loadingProfile) {
    return (
      <div className="animate-pulse">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mt-8" />
        <Skeleton className="h-6 w-60 mx-auto mt-4" />
        <Skeleton className="h-4 w-40 mx-auto mt-2" />
        <div className="flex justify-between mt-8 px-4">
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-16" />
        </div>
        <div className="grid grid-cols-3 gap-2 p-4 mt-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {profile && <ProfileHeader user={profile.user} stats={profile.stats} />}
      
      <Tabs defaultValue="all-films" className="w-full">
        <TabsList className="flex w-full border-b border-gray-200 dark:border-gray-800 bg-transparent h-auto">
          <TabsTrigger 
            value="all-films" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none dark:text-gray-400 dark:data-[state=active]:text-primary"
          >
            All Films
          </TabsTrigger>
          <TabsTrigger 
            value="favorites" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none dark:text-gray-400 dark:data-[state=active]:text-primary"
          >
            Favorites
          </TabsTrigger>
          <TabsTrigger 
            value="lists" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none dark:text-gray-400 dark:data-[state=active]:text-primary"
          >
            Lists
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none dark:text-gray-400 dark:data-[state=active]:text-primary"
          >
            Reviews
          </TabsTrigger>
          {isCurrentUser && (
            <TabsTrigger 
              value="tickets" 
              className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none dark:text-gray-400 dark:data-[state=active]:text-primary"
            >
              Tickets
            </TabsTrigger>
          )}
        </TabsList>
        
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-xs rounded-full px-3 py-1 h-auto bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded-full px-3 py-1 h-auto bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              <SortAsc className="h-3 w-3 mr-1" />
              Sort
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-7 h-7 rounded-md ${layout === 'grid' ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500'}`}
              onClick={() => setLayout('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-7 h-7 rounded-md ${layout === 'list' ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500'}`}
              onClick={() => setLayout('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all-films" className="mt-0">
          <MovieGrid 
            movies={watchedMovies || []} 
            isLoading={loadingMovies} 
            layout={layout}
            onMovieRemoved={handleMovieRemoved}
          />
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          <MovieGrid 
            movies={favoriteMovies || []} 
            isLoading={loadingFavorites} 
            layout={layout}
            onMovieRemoved={handleMovieRemoved}
          />
        </TabsContent>
        
        <TabsContent value="lists" className="mt-0">
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            No lists created yet
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-0">
          <div>
            {isDebugMode && watchedMovies && watchedMovies.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Watched Movies Info</h4>
                <div className="text-xs overflow-auto max-h-40">
                  <p className="mb-2">Total watched movies: {watchedMovies.length}</p>
                  <p className="mb-2">Movies with first impressions: {watchedMovies.filter(m => m.firstImpressions).length}</p>
                  <div className="mt-2">
                    <p className="mb-1 font-semibold">First few movies data:</p>
                    {watchedMovies.slice(0, 3).map(movie => (
                      <div key={movie.id} className="mb-2 border-l-2 border-blue-300 pl-2">
                        <p><span className="font-semibold">ID:</span> {movie.id} - <span className="font-semibold">Title:</span> {movie.movie.title}</p>
                        <p><span className="font-semibold">First Impressions:</span> {movie.firstImpressions || 'none'}</p>
                        <p><span className="font-semibold">Review:</span> {movie.review || 'none'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <UserReviews 
              watchedMovies={watchedMovies || []} 
              isLoading={loadingMovies} 
            />
          </div>
        </TabsContent>
        
        {isCurrentUser && (
          <TabsContent value="tickets" className="mt-0">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold dark:text-white">My Movie Tickets</h2>
                <TicketScannerButton />
              </div>
              
              {loadingTickets ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : !tickets || tickets.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <div className="text-5xl mb-4">🎟️</div>
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">No tickets yet</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start scanning your movie tickets to keep track of your cinema experiences
                  </p>
                  <div className="flex justify-center">
                    <TicketScannerButton />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(tickets as any[]).map((ticket: any) => (
                    <div 
                      key={ticket.id} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="p-4">
                        <h2 className="font-semibold text-lg mb-2 line-clamp-1 dark:text-white">{ticket.movieTitle}</h2>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>{ticket.theaterName || 'Unknown Theater'}</span>
                          <span>{ticket.price || 'Price N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{ticket.showDate || 'Date N/A'}</span>
                          <span>{ticket.showTime || 'Time N/A'}</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        Scanned {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
