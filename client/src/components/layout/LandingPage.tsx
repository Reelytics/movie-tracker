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
  const [loading, setLoading] = useState(true);

  // Fetch current month movies from TMDB (but just use the first one)
  useEffect(() => {
    const fetchCurrentMonthMovies = async () => {
      try {
        const response = await fetch('/api/tmdb/current-month');
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // Use just the first movie - no rotation
          const firstMovie = data.results[0];
          const formattedFilm: FeaturedFilm = {
            tmdbId: firstMovie.tmdbId,
            title: firstMovie.title,
            backdrop: firstMovie.backdropUrl || FEATURED_FILM.backdrop,
            year: firstMovie.year?.toString() || "2024",
            overview: firstMovie.overview
          };
          
          setFeaturedFilm(formattedFilm);
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
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      {/* Hero Section - Full Width like Letterboxd */}
      <section className="relative">
        {/* Full Width Hero Image */}
        <div className="relative h-[80vh] overflow-hidden">
          <img
            src={featuredFilm.backdrop}
            alt={featuredFilm.title}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Content Overlay - Centered like Letterboxd */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                Track films you've watched.
              </h1>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                Save those you want to see.
              </h2>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                Tell your friends what's good.
              </h3>
              
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-md transition-colors duration-200 mb-6"
              >
                Get started — it's free!
              </Button>
              
              <p className="text-base opacity-90">
                The social network for film lovers. Also available on 📱 and 💻
              </p>
            </div>
          </div>

          {/* Film Title Overlay - Bottom Left */}
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-xs opacity-75 mb-1">NOW FEATURING</p>
            <h4 className="text-xl font-bold">{featuredFilm.title}</h4>
            <p className="text-sm opacity-90">{featuredFilm.year}</p>
          </div>
        </div>
      </section>
    </div>
  );
}