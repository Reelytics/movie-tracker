import { useLocation, Link } from "wouter";
import { Home, Search, Film, User, Plus, LogIn, Ticket } from "lucide-react";
import { useState } from "react";
import AddMovieModal from "@/components/movies/AddMovieModal";
import { useAuth } from "@/hooks/useAuth";
import { Menu, MenuItem } from "@/components/ui/menu";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  
  const handleTicketScan = () => {
    navigate('/tickets');
  };
  
  const handleAddMovie = () => {
    setShowAddModal(true);
  };
  
  const isActive = (path: string) => location === path;
  
  // Don't show the navigation on the auth page
  if (location === "/auth") {
    return null;
  }
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-2 flex justify-around items-center md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-md lg:max-w-md xl:max-w-lg">
        <Link href="/">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500 dark:text-gray-400">
            <Home className={`h-5 w-5 ${isActive("/") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/") ? "text-primary" : ""}`}>Home</span>
          </button>
        </Link>
        
        <Link href="/search">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500 dark:text-gray-400">
            <Search className={`h-5 w-5 ${isActive("/search") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/search") ? "text-primary" : ""}`}>Explore</span>
          </button>
        </Link>
        
        <Menu
          trigger={
            <div className="flex flex-col items-center justify-center px-2 py-1">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center text-white shadow">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          }
        >
          <MenuItem onClick={handleAddMovie} icon={<Film className="h-4 w-4" />}>
            Add Movie
          </MenuItem>
          <MenuItem onClick={handleTicketScan} icon={<Ticket className="h-4 w-4" />}>
            Scan Ticket
          </MenuItem>
        </Menu>
        
        <Link href="/library">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500 dark:text-gray-400">
            <Film className={`h-5 w-5 ${isActive("/library") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/library") ? "text-primary" : ""}`}>Library</span>
          </button>
        </Link>
        
        {user ? (
          <Link href={`/user/${user.username}`}>
            <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500 dark:text-gray-400">
              <User className={`h-5 w-5 ${isActive(`/user/${user.username}`) || isActive("/profile") ? "text-primary" : ""}`} />
              <span className={`text-xs mt-1 ${isActive(`/user/${user.username}`) || isActive("/profile") ? "text-primary" : ""}`}>Profile</span>
            </button>
          </Link>
        ) : (
          <Link href="/auth">
            <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500 dark:text-gray-400">
              <LogIn className={`h-5 w-5 ${isActive("/auth") ? "text-primary" : ""}`} />
              <span className={`text-xs mt-1 ${isActive("/auth") ? "text-primary" : ""}`}>Login</span>
            </button>
          </Link>
        )}
      </nav>
      
      {showAddModal && (
        <AddMovieModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </>
  );
}
