import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WatchedMovieWithDetails, UserProfile } from "@shared/schema";
import ProfileHeader from "@/components/profile/ProfileHeader";
import MovieGrid from "@/components/movies/MovieGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc, Grid, List } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  const username = params.username;
  const { user: currentUser } = useAuth();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  
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
  const { data: watchedMovies, isLoading: loadingMovies } = useQuery<WatchedMovieWithDetails[]>({
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
  const { data: favoriteMovies, isLoading: loadingFavorites } = useQuery<WatchedMovieWithDetails[]>({
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

  // Set document title
  useEffect(() => {
    document.title = profile?.user.username 
      ? `${profile.user.username} | MovieDiary` 
      : "My Profile | MovieDiary";
  }, [profile]);

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
        <TabsList className="flex w-full border-b border-gray-200 bg-transparent h-auto">
          <TabsTrigger 
            value="all-films" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none"
          >
            All Films
          </TabsTrigger>
          <TabsTrigger 
            value="favorites" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none"
          >
            Favorites
          </TabsTrigger>
          <TabsTrigger 
            value="lists" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none"
          >
            Lists
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="flex-1 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm rounded-none"
          >
            Reviews
          </TabsTrigger>
        </TabsList>
        
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-xs rounded-full px-3 py-1 h-auto bg-gray-100 border-gray-100 hover:bg-gray-200">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded-full px-3 py-1 h-auto bg-gray-100 border-gray-100 hover:bg-gray-200">
              <SortAsc className="h-3 w-3 mr-1" />
              Sort
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-7 h-7 rounded-md ${layout === 'grid' ? 'text-gray-600 bg-gray-100' : 'text-gray-400'}`}
              onClick={() => setLayout('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-7 h-7 rounded-md ${layout === 'list' ? 'text-gray-600 bg-gray-100' : 'text-gray-400'}`}
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
          />
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          <MovieGrid 
            movies={favoriteMovies || []} 
            isLoading={loadingFavorites} 
            layout={layout}
          />
        </TabsContent>
        
        <TabsContent value="lists" className="mt-0">
          <div className="flex items-center justify-center h-40 text-gray-500">
            No lists created yet
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-0">
          <div className="flex items-center justify-center h-40 text-gray-500">
            No reviews written yet
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
