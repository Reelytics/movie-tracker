import { Link, useLocation } from "wouter";
import { UserStats } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, UserPlus, UserMinus, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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

type UserListItem = {
  id: number;
  username: string;
  fullName: string | null;
  profilePicture: string | null;
  bio: string | null;
};

export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for followers/following modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [following, setFollowing] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
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
  
  // Function to fetch followers
  const fetchFollowers = async () => {
    if (loadingUsers) return;
    
    setLoadingUsers(true);
    try {
      const response = await apiRequest("GET", `/api/users/${user.id}/followers`);
      if (!response.ok) throw new Error("Failed to fetch followers");
      const data = await response.json();
      setFollowers(data);
      setShowFollowersModal(true);
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch followers",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Function to fetch following
  const fetchFollowing = async () => {
    if (loadingUsers) return;
    
    setLoadingUsers(true);
    try {
      const response = await apiRequest("GET", `/api/users/${user.id}/following`);
      if (!response.ok) throw new Error("Failed to fetch following");
      const data = await response.json();
      setFollowing(data);
      setShowFollowingModal(true);
    } catch (error) {
      console.error("Error fetching following:", error);
      toast({
        title: "Error",
        description: "Failed to fetch following list",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Navigate to a user's profile
  const navigateToProfile = (userId: number) => {
    if (currentUser?.id === userId) {
      navigate("/profile");
    } else {
      navigate(`/profile/${userId}`);
    }
    setShowFollowersModal(false);
    setShowFollowingModal(false);
  };
  
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
              
              {!(currentUser && currentUser.id === user.id) && currentUser && (
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
          <button 
            onClick={fetchFollowing}
            disabled={loadingUsers}
            className="text-center focus:outline-none"
          >
            <div className="font-semibold">{stats.following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </button>
          <button 
            onClick={fetchFollowers}
            disabled={loadingUsers}
            className="text-center focus:outline-none"
          >
            <div className="font-semibold">{stats.followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </button>
        </div>
      </div>
      
      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Followers</DialogTitle>
            <DialogDescription className="text-center">
              People who follow {user.username}
            </DialogDescription>
          </DialogHeader>
          
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No followers yet
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {followers.map((follower) => (
                <div key={follower.id} className="flex items-center py-3 px-1">
                  <button
                    onClick={() => navigateToProfile(follower.id)}
                    className="flex items-center flex-1 focus:outline-none"
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      {follower.profilePicture ? (
                        <AvatarImage src={follower.profilePicture} alt={follower.username} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-primary to-pink-500 text-white">
                          <UserCircle className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{follower.username}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {follower.fullName || ''}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Following</DialogTitle>
            <DialogDescription className="text-center">
              People {user.username} follows
            </DialogDescription>
          </DialogHeader>
          
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Not following anyone yet
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {following.map((followed) => (
                <div key={followed.id} className="flex items-center py-3 px-1">
                  <button
                    onClick={() => navigateToProfile(followed.id)}
                    className="flex items-center flex-1 focus:outline-none"
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      {followed.profilePicture ? (
                        <AvatarImage src={followed.profilePicture} alt={followed.username} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-primary to-pink-500 text-white">
                          <UserCircle className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{followed.username}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {followed.fullName || ''}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
