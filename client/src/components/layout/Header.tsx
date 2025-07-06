import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full">
      <div className="container mx-auto flex h-12 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">R</span>
              </div>
              <span className="hidden font-bold sm:inline-block text-lg text-white">Reelytics</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Link href="/films">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-white/80 hover:text-white h-8">
              FILMS
            </Button>
          </Link>
          <Link href="/collections">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-white/80 hover:text-white h-8">
              COLLECTIONS
            </Button>
          </Link>
          <Link href="/members">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-white/80 hover:text-white h-8">
              MEMBERS
            </Button>
          </Link>
          <Link href="/reviews">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-white/80 hover:text-white h-8">
              REVIEWS
            </Button>
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-xs text-white/80 hover:text-white h-8 px-3">
            SIGN IN
          </Button>
          <Button size="sm" className="text-xs h-8 px-3 bg-green-600 hover:bg-green-700">
            CREATE ACCOUNT
          </Button>
        </div>
      </div>
    </header>
  );
}