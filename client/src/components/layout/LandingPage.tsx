import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";

interface FeaturedFilm {
  tmdbId: number;
  title: string;
  backdrop: string;
  year: string;
  overview?: string;
}

// Single featured film - no rotation
const FEATURED_FILM: FeaturedFilm = {
  tmdbId: 1,
  title: "Oppenheimer",
  backdrop: "https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
  year: "2023",
  overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II."
};

export default function LandingPage() {
  const [featuredFilm, setFeaturedFilm] = useState<FeaturedFilm>(FEATURED_FILM);
  const [recentMovies, setRecentMovies] = useState<FeaturedFilm[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch current month movies from TMDB (but just use the first one for hero)
  useEffect(() => {
    const fetchCurrentMonthMovies = async () => {
      try {
        const response = await fetch('/api/tmdb/current-month');
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // Use first movie for hero
          const firstMovie = data.results[0];
          const formattedFilm: FeaturedFilm = {
            tmdbId: firstMovie.tmdbId,
            title: firstMovie.title,
            backdrop: firstMovie.backdropUrl || FEATURED_FILM.backdrop,
            year: firstMovie.year?.toString() || "2024",            overview: firstMovie.overview
          };
          
          setFeaturedFilm(formattedFilm);

          // Use next 6 movies for recent releases section
          const recentMoviesData = data.results.slice(1, 7).map((movie: any) => ({
            tmdbId: movie.tmdbId,
            title: movie.title,
            backdrop: movie.posterUrl || movie.backdropUrl || FEATURED_FILM.backdrop,
            year: movie.year?.toString() || "2024",
            overview: movie.overview
          }));
          
          setRecentMovies(recentMoviesData);
        }
      } catch (error) {
        console.error('Failed to fetch current month movies:', error);
        // Keep fallback film if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthMovies();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      {/* Hero Section - Full width like Letterboxd */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with improved styling */}
        <div className="absolute inset-0">
          <img
            src={featuredFilm.backdrop}
            alt={featuredFilm.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Enhanced gradient overlays for better text contrast - matching Letterboxd exactly */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* NOW FEATURING Section - Positioned like Letterboxd */}
        <div className="absolute bottom-12 left-12 z-20">
          <div className="mb-3">
            <span 
              className="text-orange-400 text-sm font-bold tracking-widest uppercase"
              style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.3)' 
              }}
            >
              NOW FEATURING
            </span>
          </div>
          <h2 
            className="text-white text-5xl lg:text-6xl font-bold mb-2"
            style={{ 
              textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.5)' 
            }}
          >
            {featuredFilm.title}
          </h2>
          <span 
            className="text-white/90 text-xl font-medium"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)' 
            }}
          >
            {featuredFilm.year}
          </span>
        </div>

        {/* Main Content - Center, separated from Now Featuring */}
        <div className="relative z-10 text-center text-white space-y-8 px-6">
          <div className="space-y-6">
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              style={{ 
                textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.6)' 
              }}
            >
              Track films you've watched.
            </h1>
            <h2 
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              style={{ 
                textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.6)' 
              }}
            >
              Save those you want to see.
            </h2>
            <h3 
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              style={{ 
                textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.6)' 
              }}
            >
              Tell your friends what's good.
            </h3>
          </div>
          
          <div className="space-y-4 mt-12">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 text-xl font-bold rounded-md transition-all duration-200 transform hover:scale-105 shadow-2xl"
            >
              Get started — it's free!
            </Button>
            
            <p 
              className="text-white/80 text-lg mt-6"
              style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)' 
              }}
            >
              The social network for film lovers. Also available on{" "}
              <span className="inline-block">📱</span> and{" "}
              <span className="inline-block">💻</span>
            </p>
          </div>
        </div>

        {/* Additional dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10" />
      </section>

      {/* Recent Movies Section - Improved spacing and design */}
      {recentMovies.length > 0 && (
        <section className="py-16 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              Recent Releases
            </h3>
            <div className="flex flex-wrap justify-center gap-6">
              {recentMovies.map((movie) => (
                <div key={movie.tmdbId} className="group">
                  <div className="w-24 md:w-28 lg:w-32 transition-transform duration-200 group-hover:scale-105">
                    <div className="relative rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-200">
                      <img
                        src={movie.backdrop}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    </div>
                    <p className="text-white/70 text-xs mt-2 text-center group-hover:text-white transition-colors duration-200">
                      {movie.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}