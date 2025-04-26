import { Link } from "wouter";
import { UserStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, UserPlus, UserMinus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  user: {
    id: number;
    username: string;
    fullName: string | null;
    bio: string | null;
    profilePicture: string | null;
  };
  stats: UserStats;
}

export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check if the current user is following the profile user
  useEffect(() => {
    if (currentUser && currentUser.id !== user.id) {
      const checkFollowStatus = async () => {
        try {
          const response = await apiRequest("GET", `/api/users/${user.id}/is-following`);
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        } catch (error) {
          console.error("Failed to check follow status:", error);
        }
      };
      
      checkFollowStatus();
    }
  }, [currentUser, user.id]);
  
  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await apiRequest("DELETE", `/api/users/${user.id}/follow`);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${user.username}`,
        });
      } else {
        // Follow
        await apiRequest("POST", `/api/users/${user.id}/follow`);
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${user.username}`,
        });
      }
      
      // Invalidate stats to update followers count
      queryClient.invalidateQueries({
        queryKey: ["user", user.id],
      });
    } catch (error) {
      console.error("Failed to toggle follow status:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <section id="profile-section" className="pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start">
          <div className="mr-5">
            <Avatar className="w-20 h-20 border-2 border-white shadow">
              {user.profilePicture ? (
                <AvatarImage 
                  src={user.profilePicture} 
                  alt={`${user.username}'s profile`} 
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-primary to-pink-500 text-white">
                  <UserCircle className="h-10 w-10" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-1">{user.username}</h2>
                <p className="text-gray-600 text-sm mb-3">{user.fullName || ""}</p>
                <p className="text-sm mb-3">{user.bio || "No bio yet"}</p>
              </div>
              
              {currentUser && currentUser.id === user.id ? (
                <Link href="/edit-profile">
                  <Button variant="outline" size="sm" className="bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300">
                    Edit Profile
                  </Button>
                </Link>
              ) : currentUser && (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={isLoading}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className={isFollowing ? "border-red-200 hover:bg-red-100 hover:text-red-600" : ""}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="mr-1 h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6 pb-2 border-b border-gray-200">
          <div className="text-center">
            <div className="font-semibold">{stats.watched}</div>
            <div className="text-xs text-gray-500">Watched</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.favorites}</div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.reviews}</div>
            <div className="text-xs text-gray-500">Reviews</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
