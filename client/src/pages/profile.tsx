import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WatchedMovieWithDetails, UserProfile } from "@shared/schema";
import ProfileHeader from "@/components/profile/ProfileHeader";
import MovieGrid from "@/components/movies/MovieGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc, Grid, List } from "lucide-react";

export default function Profile() {
  // Fetch user profile data
  const { data: profile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ["/api/users/current"]
  });

  // Fetch watched movies
  const { data: watchedMovies, isLoading: loadingMovies } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/watched"]
  });

  // Fetch favorite movies
  const { data: favoriteMovies, isLoading: loadingFavorites } = useQuery<WatchedMovieWithDetails[]>({
    queryKey: ["/api/movies/favorites"]
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
            <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-600 bg-gray-100 rounded-md">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-400 rounded-md">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all-films" className="mt-0">
          <MovieGrid 
            movies={watchedMovies || []} 
            isLoading={loadingMovies} 
            layout="grid"
          />
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          <MovieGrid 
            movies={favoriteMovies || []} 
            isLoading={loadingFavorites} 
            layout="grid"
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
