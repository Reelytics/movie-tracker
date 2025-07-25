import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full bg-slate-900/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo - Letterboxd style with colored dots */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center space-x-3">
              {/* Three colored dots like Letterboxd */}
              <div className="flex space-x-1">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              </div>
              <span className="font-bold text-lg text-white">Letterboxd</span>
            </div>
          </Link>
        </div>

        {/* Navigation - Letterboxd style */}
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex items-center space-x-8">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                SIGN IN
              </Button>
            </Link>
            <Link href="/create-account">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                CREATE ACCOUNT
              </Button>
            </Link>
            <Link href="/films">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                FILMS
              </Button>
            </Link>
            <Link href="/lists">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                LISTS
              </Button>
            </Link>
            <Link href="/members">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                MEMBERS
              </Button>
            </Link>
            <Link href="/journal">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-white/90 hover:text-white h-8 px-0 hover:bg-transparent">
                JOURNAL
              </Button>
            </Link>
          </nav>
          
          {/* Search Bar - Letterboxd style */}
          <div className="relative">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 w-80 border border-white/20">
              <Search className="h-4 w-4 text-white/60 mr-3" />
              <input
                type="text"
                placeholder=""
                className="bg-transparent text-white placeholder-white/60 text-sm border-0 outline-none flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}