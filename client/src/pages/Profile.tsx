import { useState } from "react";
import { Settings, ExternalLink, Trophy, Flame, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import PopcornBag from "@/components/profile/PopcornBag";
import RatingCircle from "@/components/movie/RatingCircle";

import { 
  profileStats, 
  achievements, 
  userActivity 
} from "@/lib/mockData";

export default function Profile() {
  const [popcornCount, setPopcornCount] = useState(42);
  const [popcornMaxCount, setPopcornMaxCount] = useState(100);
  const [level, setLevel] = useState(2);

  const iconMap: Record<string, React.ReactNode> = {
    trophy: <Trophy className="h-5 w-5" />,
    fire: <Flame className="h-5 w-5" />,
    film: <Film className="h-5 w-5" />
  };

  return (
    <div id="profile-view">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-bold">Profile</h1>
          <button className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <section className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                alt="Profile picture" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Alex Johnson</h2>
              <p className="text-muted-foreground">Film enthusiast • Los Angeles, CA</p>
              <div className="flex mt-2 gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="px-3 py-1 bg-primary rounded-md text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="px-3 py-1 bg-card rounded-md text-xs font-medium hover:bg-card/90 transition"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">Bio</p>
            <p>Passionate about film and storytelling. I love sci-fi, drama, and anything directed by Denis Villeneuve. Always on the hunt for hidden gems at my local theaters.</p>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Your Popcorn Collection</h2>
          
          <div className="bg-card rounded-xl p-6 mb-4">
            <div className="flex flex-col items-center">
              <div className="mb-3 text-xl font-bold text-primary">Level {level} Collector</div>
              
              <PopcornBag count={popcornCount} maxCount={popcornMaxCount} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4">
              <div className="text-muted-foreground text-sm mb-1">Total Movies</div>
              <div className="text-2xl font-bold">{profileStats.totalMovies}</div>
            </div>
            <div className="bg-card rounded-lg p-4">
              <div className="text-muted-foreground text-sm mb-1">This Month</div>
              <div className="text-2xl font-bold">{profileStats.thisMonth}</div>
            </div>
            <div className="bg-card rounded-lg p-4">
              <div className="text-muted-foreground text-sm mb-1">Theaters</div>
              <div className="text-2xl font-bold">{profileStats.theaters}</div>
            </div>
            <div className="bg-card rounded-lg p-4">
              <div className="text-muted-foreground text-sm mb-1">Reviews</div>
              <div className="text-2xl font-bold">{profileStats.reviews}</div>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            <button className="text-sm text-muted-foreground">See all</button>
          </div>
          
          <div className="space-y-4">
            {userActivity.map((activity) => (
              <div key={activity.id} className="bg-card rounded-lg p-4">
                <div className="flex gap-3">
                  <img 
                    src={activity.movie.poster} 
                    alt={`${activity.movie.title} poster`} 
                    className="w-12 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Watched {activity.movie.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.theater} • {activity.date}</p>
                      </div>
                      <RatingCircle rating={activity.userRating} />
                    </div>
                    {activity.comment && (
                      <p className="text-sm mt-2">"{activity.comment}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Achievements</h2>
            <button className="text-sm text-muted-foreground">View all</button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`bg-card rounded-lg p-3 flex flex-col items-center text-center ${!achievement.unlocked ? 'opacity-50' : ''}`}
              >
                <div className={`w-12 h-12 rounded-full ${achievement.unlocked ? 'bg-primary/20 text-primary' : 'bg-background/80 text-muted-foreground'} flex items-center justify-center mb-2`}>
                  {iconMap[achievement.icon]}
                </div>
                <p className="text-sm font-medium">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.unlocked ? achievement.date : 'Locked'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
