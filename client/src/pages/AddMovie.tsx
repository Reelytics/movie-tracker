import { Link } from "wouter";
import { X, Search, Camera, ChevronRight } from "lucide-react";
import { recentMovies } from "@/lib/mockData";
import MovieCard from "@/components/movie/MovieCard";

export default function AddMovie() {
  return (
    <div id="add-movie-view">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <button className="text-muted-foreground">
              <X className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-lg font-medium">Add to Watched</h1>
          <div className="w-5"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <Link href="/search">
              <div className="bg-card p-4 rounded-lg flex items-center gap-4 mb-4">
                <div className="bg-primary/20 rounded-full w-12 h-12 flex items-center justify-center text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Search for a movie</h3>
                  <p className="text-sm text-muted-foreground">Find and add a movie you've watched</p>
                </div>
                <ChevronRight className="ml-auto text-muted-foreground h-5 w-5" />
              </div>
            </Link>
            
            <Link href="/scan">
              <div className="bg-card p-4 rounded-lg flex items-center gap-4">
                <div className="bg-primary/20 rounded-full w-12 h-12 flex items-center justify-center text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Scan your ticket</h3>
                  <p className="text-sm text-muted-foreground">We'll identify the movie automatically</p>
                </div>
                <ChevronRight className="ml-auto text-muted-foreground h-5 w-5" />
              </div>
            </Link>
          </section>
          
          <section>
            <h2 className="text-lg font-medium mb-3">Recent Movies in Theaters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentMovies.map(movie => (
                <Link key={movie.id} href={`/movie/${movie.id}`}>
                  <div className="bg-card rounded-lg overflow-hidden">
                    <img 
                      src={movie.poster} 
                      alt={`${movie.title} poster`} 
                      className="w-full aspect-[2/3] object-cover" 
                    />
                    <div className="p-2">
                      <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-muted-foreground">{movie.year}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
