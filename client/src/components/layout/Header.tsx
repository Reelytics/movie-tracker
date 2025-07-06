import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <span className="hidden font-bold sm:inline-block text-xl">Reelytics</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/films">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              FILMS
            </Button>
          </Link>
          <Link href="/collections">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              COLLECTIONS
            </Button>
          </Link>
          <Link href="/members">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              MEMBERS
            </Button>
          </Link>
          <Link href="/reviews">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              REVIEWS
            </Button>
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-sm">
            SIGN IN
          </Button>
          <Button size="sm" className="text-sm">
            CREATE ACCOUNT
          </Button>
        </div>
      </div>
    </header>
  );
}