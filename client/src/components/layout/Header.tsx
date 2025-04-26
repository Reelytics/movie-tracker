import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [location, navigate] = useLocation();
  const [notificationCount] = useState(3);
  
  const handleSearchClick = () => {
    navigate("/search");
  };
  
  // We don't show the header on the search page
  if (location === "/search") {
    return null;
  }
  
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link href="/">
        <h1 className="text-2xl font-semibold cursor-pointer">MovieDiary</h1>
      </Link>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="p-2" onClick={handleSearchClick}>
          <Search className="h-5 w-5 text-gray-700" />
        </Button>
        <Button variant="ghost" size="icon" className="p-2 relative">
          <Bell className="h-5 w-5 text-gray-700" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center p-0 rounded-full">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
