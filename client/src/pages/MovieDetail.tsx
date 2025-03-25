import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import RatingCircle from "@/components/movie/RatingCircle";

import { 
  popularMovies, 
  poorThingsCast, 
  poorThingsStreaming
} from "@/lib/mockData";

export default function MovieDetail() {
  const { id } = useParams();
  const movieId = parseInt(id);
  
  // Find the movie in our mock data
  const movie = popularMovies.find(m => m.id === movieId) || popularMovies[0];
  
  // Rating state
  const [userRating, setUserRating] = useState(8.0);
  
  return (
    <div id="movie-detail-view">
      <header className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <button className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
        </div>
        <div className="h-64 md:h-80 relative bg-background">
          <img 
            src={movie.poster} 
            alt={`${movie.title} backdrop`} 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end">
            <div className="flex-shrink-0 w-24 h-36 rounded-md overflow-hidden mr-4 shadow-lg">
              <img 
                src={movie.poster} 
                alt={`${movie.title} poster`} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{movie.title}</h1>
              <p className="text-sm text-muted-foreground mb-1">
                {movie.year} • {movie.runtime} • R
              </p>
              <div className="flex flex-wrap gap-1">
                {movie.genres?.map((genre, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-0.5 bg-muted/80 backdrop-blur-sm rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <RatingCircle rating={movie.rating} size="md" />
            <div>
              <div className="text-sm font-medium">Reelytics Rating</div>
              <div className="text-xs text-muted-foreground">5,426 ratings</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-2">Synopsis</h2>
            <p className="text-muted-foreground">
              {movie.synopsis || "No synopsis available for this movie."}
            </p>
          </section>
          
          <section>
            <h2 className="text-lg font-medium mb-3">Cast</h2>
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2">
              {poorThingsCast.map((person) => (
                <div key={person.id} className="flex-shrink-0 w-24">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
                    <img 
                      src={person.photo} 
                      alt={person.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="text-lg font-medium mb-3">Your Rating</h2>
            <div className="bg-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm">How would you rate this movie?</p>
                <div className="text-xl font-bold text-primary">
                  {userRating.toFixed(1)}
                </div>
              </div>
              <div className="mt-3">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.5" 
                  value={userRating} 
                  onChange={(e) => setUserRating(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  style={{
                    '--range-shdw': 'hsl(var(--primary))',
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
              <div className="mt-4">
                <button className="w-full py-2.5 bg-primary rounded-lg font-medium text-primary-foreground hover:bg-primary/90 transition">
                  Save Rating
                </button>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-lg font-medium mb-3">Where to Watch</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {poorThingsStreaming.map((service) => (
                <div key={service.id} className="bg-card p-3 rounded-lg flex flex-col items-center justify-center text-center">
                  <img 
                    src={service.logo} 
                    alt={service.name} 
                    className="h-8 mb-2 rounded" 
                  />
                  <p className="text-sm">{service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.type === "Subscription" ? service.type : `${service.type} ${service.price}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
