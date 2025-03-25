import { profileStats, genreStats, theaterVisits } from "@/lib/mockData";
import { BarChart3, ChartLineUp } from "lucide-react";
import RatingCircle from "@/components/movie/RatingCircle";

export default function Statistics() {
  return (
    <div id="stats-view">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-heading font-bold">Your Statistics</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4">
            <h3 className="text-sm text-muted-foreground mb-1">Movies Watched</h3>
            <p className="text-3xl font-bold">{profileStats.totalMovies}</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <h3 className="text-sm text-muted-foreground mb-1">Average Rating</h3>
            <p className="text-3xl font-bold">7.8</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <h3 className="text-sm text-muted-foreground mb-1">Total Hours</h3>
            <p className="text-3xl font-bold">86</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <h3 className="text-sm text-muted-foreground mb-1">Theaters Visited</h3>
            <p className="text-3xl font-bold">{profileStats.theaters}</p>
          </div>
        </div>
        
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Genres You Watch</h2>
          <div className="bg-card rounded-lg p-4">
            <div className="space-y-3">
              {genreStats.map((genre, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{genre.name}</span>
                    <span>{genre.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${genre.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Your Theater Visits</h2>
          <div className="bg-card rounded-lg p-4">
            <div className="space-y-4">
              {theaterVisits.map((theater) => (
                <div key={theater.id} className="flex items-center">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div className="flex-1">
                    <h3 className="font-medium">{theater.name}</h3>
                    <p className="text-xs text-muted-foreground">{theater.visits} visits</p>
                  </div>
                  <RatingCircle rating={theater.averageRating} />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-lg font-medium mb-4">Watching History</h2>
          <div className="bg-card rounded-lg overflow-hidden">
            <div className="relative h-64">
              <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-4">
                <BarChart3 className="h-16 w-16 text-primary/50 mb-3" />
                <h3 className="text-lg font-medium mb-1">Movie Watching Trends</h3>
                <p className="text-sm text-muted-foreground mb-3">Watch more movies to see your viewing patterns</p>
                <div className="text-xs text-muted-foreground">Coming in the next update</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
