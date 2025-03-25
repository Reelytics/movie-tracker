import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Plus, 
  BarChart2, 
  UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  // Define nav items
  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Add", path: "/add", icon: Plus, isAddButton: true },
    { name: "Stats", path: "/stats", icon: BarChart2 },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ];

  // Check if a path is active, special case for movie detail paths
  const isActive = (path: string) => {
    if (path === location) return true;
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-colors",
              item.isAddButton ? "" : "px-4",
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.isAddButton ? (
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -mt-4">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            ) : (
              <item.icon className="w-5 h-5" />
            )}
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
