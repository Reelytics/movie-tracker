import { useState } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, X, Film } from "lucide-react";
import { popularSearches } from "@/lib/mockData";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState([
    "Poor Things",
    "Denis Villeneuve"
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setRecentSearches(prev => {
        // Add to recent searches and remove duplicates
        const newSearches = [searchTerm, ...prev.filter(s => s !== searchTerm)];
        // Keep only the last 5 searches
        return newSearches.slice(0, 5);
      });
      // Here we would normally trigger a search API call
    }
  };

  const removeRecentSearch = (search: string) => {
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  return (
    <div id="search-view">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="Search for movies, actors, directors..."
              className="w-full bg-muted border-0 rounded-lg px-4 py-3 pl-10 text-foreground focus:ring-1 focus:ring-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term, index) => (
              <button
                key={index}
                className="px-3 py-1.5 bg-card rounded-full text-sm"
                onClick={() => setSearchTerm(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
        
        {recentSearches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3">Recent Searches</h2>
            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="text-muted-foreground h-5 w-5" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M12 8v4l3 3"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <button onClick={() => setSearchTerm(search)}>
                      {search}
                    </button>
                  </div>
                  <button 
                    className="text-muted-foreground"
                    onClick={() => removeRecentSearch(search)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Browse by Genre</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Drama genre" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition">
                <span className="font-medium">Drama</span>
              </div>
            </div>
            <div className="aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Action genre" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition">
                <span className="font-medium">Action</span>
              </div>
            </div>
            <div className="aspect-video bg-card rounded-lg overflow-hidden flex items-center justify-center relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1605806616949-59450419c3a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Comedy genre" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition">
                <span className="font-medium">Comedy</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
