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
      
      {/* Hero Section */}
      <section className="relative py-16">
        <div className="max-w-6xl mx-auto px-8">
          {/* Constrained Hero Image */}
          <div className="relative rounded-lg overflow-hidden mb-8" style={{ aspectRatio: '16/9' }}>
            <img
              src={featuredFilm.backdrop}
              alt={featuredFilm.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Film Title Overlay */}
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs opacity-75 mb-1">NOW FEATURING</p>
              <h4 className="text-lg font-bold">{featuredFilm.title}</h4>
              <p className="text-xs opacity-90">{featuredFilm.year}</p>
            </div>
          </div>

          {/* Content Below Image */}
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
              Track films you've watched.
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
              Save those you want to see.
            </h2>
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Tell your friends what's good.
            </h3>
            
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-semibold rounded-md transition-colors duration-200 mb-4"
            >
              Get started — it's free!
            </Button>
            
            <p className="text-sm opacity-90">
              The social network for film lovers. Also available on 📱 and 💻
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}