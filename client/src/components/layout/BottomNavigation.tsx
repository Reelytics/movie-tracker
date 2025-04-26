import { useLocation, Link } from "wouter";
import { Home, Search, Film, User, Plus } from "lucide-react";
import { useState } from "react";
import AddMovieModal from "@/components/movies/AddMovieModal";

export default function BottomNavigation() {
  const [location] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  
  const isActive = (path: string) => location === path;
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-10">
        <Link href="/">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500">
            <Home className={`h-5 w-5 ${isActive("/") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/") ? "text-primary" : ""}`}>Home</span>
          </button>
        </Link>
        
        <Link href="/search">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500">
            <Search className={`h-5 w-5 ${isActive("/search") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/search") ? "text-primary" : ""}`}>Explore</span>
          </button>
        </Link>
        
        <button 
          className="flex flex-col items-center justify-center px-2 py-1"
          onClick={() => setShowAddModal(true)}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center text-white shadow">
            <Plus className="h-5 w-5" />
          </div>
        </button>
        
        <Link href="/library">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500">
            <Film className={`h-5 w-5 ${isActive("/library") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/library") ? "text-primary" : ""}`}>Library</span>
          </button>
        </Link>
        
        <Link href="/profile">
          <button className="flex flex-col items-center justify-center px-1 py-1 text-gray-500">
            <User className={`h-5 w-5 ${isActive("/profile") ? "text-primary" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/profile") ? "text-primary" : ""}`}>Profile</span>
          </button>
        </Link>
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
