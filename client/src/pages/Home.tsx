import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

import MovieCard from "@/components/movie/MovieCard";
import RatingCircle from "@/components/movie/RatingCircle";
import AuthButtons from "@/components/auth/AuthButtons";

import { 
  popularMovies, 
  featuredMovie, 
  recentlyWatched 
} from "@/lib/mockData";

export default function Home() {
  return (
    <div id="home-view">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">Reelytics</h1>
          <AuthButtons />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Featured Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Featured</h2>
            <button className="text-sm text-muted-foreground">See all</button>
          </div>
          
          <Link href={`/movie/${featuredMovie.id}`}>
            <div className="relative rounded-xl overflow-hidden h-48 md:h-64 mb-6">
              <img 
                src={featuredMovie.backdrop} 
                alt={`${featuredMovie.title} backdrop`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-4">
                <span className="text-xs bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-sm mb-2 w-fit">
                  Featured
                </span>
                <h3 className="text-xl font-bold">{featuredMovie.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {featuredMovie.year} • {featuredMovie.genres?.join('/')} • {featuredMovie.runtime}
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* Popular Movies Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Popular Now</h2>
            <button className="text-sm text-muted-foreground">More</button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Recently Watched Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Recently Watched</h2>
            <button className="text-sm text-muted-foreground">See history</button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2">
            {recentlyWatched.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <div className="flex-shrink-0 w-64 bg-card rounded-lg overflow-hidden">
                  <div className="relative">
                    <img 
                      src={movie.poster} 
                      alt={`${movie.title} still`} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                      <span className="text-xs text-muted-foreground">Watched {movie.watchedDate}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{movie.title}</h3>
                        <p className="text-xs text-muted-foreground">{movie.year} • {movie.theater}</p>
                      </div>
                      <RatingCircle rating={movie.userRating || movie.rating} />
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {movie.genres?.map((genre, index) => (
                        <span key={index} className="text-xs bg-background px-2 py-0.5 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Your Recommendations</h2>
            <button className="text-sm text-muted-foreground">Refresh</button>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-card rounded-xl p-4 text-center">
            <div className="text-4xl text-primary opacity-50 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 9.5a2.5 2.5 0 0 1 2.5-2.5h3.8a2.5 2.5 0 0 1 2.2 1.4l1.6 3.2a2.5 2.5 0 0 0 2.2 1.4H19a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h-4.8a2.5 2.5 0 0 1-2.2-1.4l-1.6-3.2a2.5 2.5 0 0 0-2.2-1.4H5a2.5 2.5 0 0 1-2.5-2.5v0Z"/>
                <path d="M10 2v10"/>
                <path d="M7 5h6"/>
                <path d="M7 22v-3"/>
                <path d="M10 22v-6"/>
                <path d="M13 22v-3"/>
                <path d="M16 22v-3"/>
                <path d="M19 22v-3"/>
              </svg>
            </div>
            <h3 className="font-medium mb-1">Personalized Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-3">Watch more movies to get personalized recommendations based on your taste.</p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition">
              Explore popular movies
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
