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

// Fallback films in case API fails
const FALLBACK_FILMS: FeaturedFilm[] = [
  {
    tmdbId: 1,
    title: "Oppenheimer",
    backdrop: "https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    year: "2023",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II."
  },
  {
    tmdbId: 2, 
    title: "Barbie",
    backdrop: "https://image.tmdb.org/t/p/w1280/ctmA4kMVFiixLyRA0GKPiAbAvsX.jpg",
    year: "2023",
    overview: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land."
  },
  {
    tmdbId: 3,
    title: "Spider-Man: Across the Spider-Verse", 
    backdrop: "https://image.tmdb.org/t/p/w1280/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    year: "2023",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse."
  }
];

export default function LandingPage() {
  const [featuredFilms, setFeaturedFilms] = useState<FeaturedFilm[]>(FALLBACK_FILMS);
  const [currentFilmIndex, setCurrentFilmIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch current month movies from TMDB
  useEffect(() => {
    const fetchCurrentMonthMovies = async () => {
      try {
        const response = await fetch('/api/tmdb/current-month');
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // Convert API response to our format and take the first 5 movies
          const formattedFilms: FeaturedFilm[] = data.results.slice(0, 5).map((movie: any) => ({
            tmdbId: movie.tmdbId,
            title: movie.title,
            backdrop: movie.backdropUrl || FALLBACK_FILMS[0].backdrop,
            year: movie.year?.toString() || "2024",
            overview: movie.overview
          }));
          
          setFeaturedFilms(formattedFilms);
        }
      } catch (error) {
        console.error('Failed to fetch current month movies:', error);
        // Keep fallback films if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthMovies();
  }, []);

  // Rotate through featured films every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFilmIndex((prev) => (prev + 1) % featuredFilms.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredFilms.length]);

  const currentFilm = featuredFilms[currentFilmIndex];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={currentFilm.backdrop}
            alt={currentFilm.title}
            className="w-full h-full object-cover transition-opacity duration-1000"
            key={currentFilm.tmdbId}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Track films you've watched.
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Save those you want to see.
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Tell your friends what's good.
            </h3>
            
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-md transition-colors duration-200"
            >
              Get started — it's free!
            </Button>
            
            <p className="mt-6 text-lg opacity-90">
              The social network for film lovers. Also available on 📱 and 💻
            </p>
          </div>
        </div>

        {/* Film Title Overlay */}
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-sm opacity-75 mb-1">NOW FEATURING</p>
          <h4 className="text-2xl font-bold">{currentFilm.title}</h4>
          <p className="text-sm opacity-90">{currentFilm.year}</p>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 right-8 flex space-x-2">
          {featuredFilms.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFilmIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentFilmIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}