export interface Movie {
  id: number;
  title: string;
  year: number;
  poster: string;
  backdrop?: string;
  rating: number;
  synopsis?: string;
  runtime?: string;
  genres?: string[];
  whereToWatch?: StreamingService[];
  cast?: CastMember[];
}

export interface CastMember {
  id: number;
  name: string;
  role: string;
  photo: string;
}

export interface StreamingService {
  id: number;
  name: string;
  logo: string;
  type: "Subscription" | "Rent" | "Buy";
  price?: string;
}

export interface RecentlyWatched extends Movie {
  watchedDate: string;
  theater?: string;
  userRating?: number;
}

export interface TheaterVisit {
  id: number;
  name: string;
  visits: number;
  averageRating: number;
}

export interface GenreStat {
  name: string;
  percentage: number;
}

export interface ProfileStats {
  totalMovies: number;
  thisMonth: number;
  theaters: number;
  reviews: number;
}

export interface Achievement {
  id: number;
  name: string;
  icon: string;
  date?: string;
  unlocked: boolean;
}

export interface UserActivity {
  id: number;
  movie: Movie;
  theater?: string;
  date: string;
  userRating: number;
  comment?: string;
}

// Popular Movies
export const popularMovies: Movie[] = [
  {
    id: 1,
    title: "Poor Things",
    year: 2023,
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 8.5,
    genres: ["Drama", "Science Fiction", "Comedy"],
    runtime: "2h 21m",
    synopsis: "From filmmaker Yorgos Lanthimos and producer Emma Stone comes the tale of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter. Under Baxter's protection, Bella is eager to learn. Hungry for the worldliness she is lacking, Bella runs off with Duncan Wedderburn, a slick and debauched lawyer, on a whirlwind adventure across continents."
  },
  {
    id: 2,
    title: "Oppenheimer",
    year: 2023,
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 9.2,
    genres: ["Biography", "Drama", "History"],
    runtime: "3h 0m"
  },
  {
    id: 3,
    title: "The Holdovers",
    year: 2023,
    poster: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 7.8,
    genres: ["Comedy", "Drama"],
    runtime: "2h 14m"
  },
  {
    id: 4,
    title: "The Batman",
    year: 2022,
    poster: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 8.8,
    genres: ["Action", "Crime", "Drama"],
    runtime: "2h 56m"
  }
];

// Featured movie
export const featuredMovie: Movie = {
  id: 5,
  title: "Dune: Part Two",
  year: 2024,
  poster: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  backdrop: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  rating: 9.0,
  runtime: "2h 46m",
  genres: ["Sci-Fi", "Adventure"],
};

// Recent Movies (in theaters)
export const recentMovies: Movie[] = [
  {
    id: 5,
    title: "Dune: Part Two",
    year: 2024,
    poster: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 9.0,
    genres: ["Sci-Fi", "Adventure"],
    runtime: "2h 46m"
  },
  {
    id: 6,
    title: "The Fall Guy",
    year: 2024,
    poster: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 7.5,
    genres: ["Action", "Comedy"],
    runtime: "2h 6m"
  },
  {
    id: 7,
    title: "Civil War",
    year: 2024,
    poster: "https://images.unsplash.com/photo-1512070679279-8988d32161be?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 7.8,
    genres: ["Action", "Drama", "Thriller"],
    runtime: "1h 49m"
  }
];

// Recently Watched Movies
export const recentlyWatched: RecentlyWatched[] = [
  {
    id: 8,
    title: "Killers of the Flower Moon",
    year: 2023,
    poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 9.0,
    watchedDate: "May 2",
    theater: "AMC Century City",
    userRating: 9.0,
    genres: ["Drama", "Western"]
  },
  {
    id: 6,
    title: "The Fall Guy",
    year: 2024,
    poster: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    rating: 7.5,
    watchedDate: "Apr 28",
    theater: "Regal LA Live",
    userRating: 7.5,
    genres: ["Action", "Comedy"]
  }
];

// Cast for Poor Things
export const poorThingsCast: CastMember[] = [
  {
    id: 1,
    name: "Emma Stone",
    role: "Bella Baxter",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 2,
    name: "Mark Ruffalo",
    role: "Duncan Wedderburn",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 3,
    name: "Willem Dafoe",
    role: "Dr. Godwin Baxter",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

// Where to watch for Poor Things
export const poorThingsStreaming: StreamingService[] = [
  {
    id: 1,
    name: "HBO Max",
    logo: "https://via.placeholder.com/60x30?text=HBO",
    type: "Subscription"
  },
  {
    id: 2,
    name: "Amazon Prime",
    logo: "https://via.placeholder.com/60x30?text=Prime",
    type: "Rent",
    price: "$5.99"
  },
  {
    id: 3,
    name: "Apple TV",
    logo: "https://via.placeholder.com/60x30?text=Apple",
    type: "Buy",
    price: "$19.99"
  }
];

// Popular searches
export const popularSearches: string[] = [
  "Dune: Part Two",
  "Oppenheimer",
  "Christopher Nolan",
  "Zendaya",
  "Science Fiction"
];

// Genre stats
export const genreStats: GenreStat[] = [
  { name: "Drama", percentage: 38 },
  { name: "Sci-Fi", percentage: 24 },
  { name: "Action", percentage: 18 },
  { name: "Comedy", percentage: 12 },
  { name: "Horror", percentage: 8 }
];

// Theater visits
export const theaterVisits: TheaterVisit[] = [
  { id: 1, name: "AMC Century City", visits: 12, averageRating: 8.8 },
  { id: 2, name: "Regal LA Live", visits: 8, averageRating: 7.2 },
  { id: 3, name: "Landmark Theaters", visits: 5, averageRating: 9.4 }
];

// Profile stats
export const profileStats: ProfileStats = {
  totalMovies: 42,
  thisMonth: 7,
  theaters: 8,
  reviews: 28
};

// Achievements
export const achievements: Achievement[] = [
  { id: 1, name: "First Review", icon: "trophy", date: "Mar 2023", unlocked: true },
  { id: 2, name: "5 in a Month", icon: "fire", date: "Apr 2023", unlocked: true },
  { id: 3, name: "Sci-Fi Expert", icon: "film", unlocked: false }
];

// User activity
export const userActivity: UserActivity[] = [
  {
    id: 1,
    movie: {
      id: 5,
      title: "Dune: Part Two",
      year: 2024,
      poster: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      rating: 9.0
    },
    theater: "AMC Century City",
    date: "2 days ago",
    userRating: 9.0,
    comment: "Visually stunning sequel with incredible sound design. Denis Villeneuve delivers again."
  },
  {
    id: 2,
    movie: {
      id: 7,
      title: "Civil War",
      year: 2024,
      poster: "https://images.unsplash.com/photo-1512070679279-8988d32161be?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      rating: 7.5
    },
    theater: "Regal LA Live",
    date: "1 week ago",
    userRating: 7.5,
    comment: "Intense and thought-provoking. Great performances but left me feeling unsettled."
  }
];
