import { useState, useEffect } from "react";
import { Bell, Search, LogOut, User, LogIn, Film, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Header() {
  const [location, navigate] = useLocation();
  const [notificationCount] = useState(3);
  const { user, logout } = useAuth();
  
  // Force refresh the component when user object changes
  const userProfilePicture = user?.profilePicture;
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use useEffect to detect changes to the user's profile picture
  useEffect(() => {
    // When user profile picture changes, increment refreshKey to force re-render
    setRefreshKey(prev => prev + 1);
    console.log("Header detected profile picture change:", userProfilePicture);
  }, [userProfilePicture]);
  
  const handleSearchClick = () => {
    navigate("/search");
  };
  
  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };
  
  // We don't show the header on the search page or auth page
  if (location === "/search" || location === "/auth") {
    return null;
  }
  
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-full mx-auto">
        <Link href="/">
          <div className="flex items-center">
            <Film className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-2xl font-semibold cursor-pointer">Reelytics</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="p-2" onClick={handleSearchClick}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="p-2 relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center p-0 rounded-full">
                {notificationCount}
              </Badge>
            )}
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full" size="icon">
                  <Avatar key={refreshKey}>
                    {user.profilePicture ? (
                      <AvatarImage 
                        src={user.profilePicture}
                        alt={user.username}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.fullName || user.username}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user ? `/user/${user.username}` : "/profile"} className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edit-profile" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <ThemeToggle />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="h-5 w-5 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
