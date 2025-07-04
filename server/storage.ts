import { 
  User, InsertUser, 
  Movie, InsertMovie, 
  Genre, InsertGenre, 
  MovieGenre, InsertMovieGenre, 
  Watched, InsertWatched, 
  Theater, InsertTheater,
  users, movies, genres, movieGenres, watched, theaters
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updatePopcornCount(userId: number, count: number): Promise<User | undefined>;
  
  // Movie operations
  getMovie(id: number): Promise<Movie | undefined>;
  getMovieByTitle(title: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  getPopularMovies(limit?: number): Promise<Movie[]>;
  getRecentMovies(limit?: number): Promise<Movie[]>;
  searchMovies(term: string): Promise<Movie[]>;
  
  // Genre operations
  getGenre(id: number): Promise<Genre | undefined>;
  getGenreByName(name: string): Promise<Genre | undefined>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  getMovieGenres(movieId: number): Promise<Genre[]>;
  
  // MovieGenre operations
  addGenreToMovie(data: InsertMovieGenre): Promise<MovieGenre>;
  
  // Watched operations
  getWatched(id: number): Promise<Watched | undefined>;
  createWatched(watched: InsertWatched): Promise<Watched>;
  getUserWatched(userId: number, limit?: number): Promise<Watched[]>;
  getMovieWatches(movieId: number): Promise<Watched[]>;
  getUserMovieStats(userId: number): Promise<{ 
    totalMovies: number;
    thisMonth: number;
    theaters: number;
    reviews: number;
  }>;
  getUserGenreStats(userId: number): Promise<{ name: string; percentage: number }[]>;
  
  // Theater operations
  getTheater(id: number): Promise<Theater | undefined>;
  getTheaterByName(name: string): Promise<Theater | undefined>;
  createTheater(theater: InsertTheater): Promise<Theater>;
  getUserTheaterVisits(userId: number): Promise<{ 
    id: number; 
    name: string; 
    visits: number; 
    averageRating: number;
  }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private movies: Map<number, Movie>;
  private genres: Map<number, Genre>;
  private movieGenres: Map<number, MovieGenre>;
  private watchedMovies: Map<number, Watched>;
  private theaters: Map<number, Theater>;
  
  private currentUserID: number;
  private currentMovieID: number;
  private currentGenreID: number;
  private currentMovieGenreID: number;
  private currentWatchedID: number;
  private currentTheaterID: number;

  constructor() {
    this.users = new Map();
    this.movies = new Map();
    this.genres = new Map();
    this.movieGenres = new Map();
    this.watchedMovies = new Map();
    this.theaters = new Map();
    
    this.currentUserID = 1;
    this.currentMovieID = 1;
    this.currentGenreID = 1;
    this.currentMovieGenreID = 1;
    this.currentWatchedID = 1;
    this.currentTheaterID = 1;
    
    // Initialize with some sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Add default user
    this.createUser({
      username: "user",
      password: "password", // In a real app, this would be hashed
      displayName: "Movie Lover",
      bio: "I love watching movies!",
      location: "New York, NY",
      avatarUrl: "https://api.dicebear.com/6.x/avataaars/svg?seed=movie"
    });
    
    // Add some genres
    const genreNames = ["Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Biography", "History", "Western"];
    genreNames.forEach(name => this.createGenre({ name }));
    
    // Add some theaters
    const theaterNames = ["AMC Century City", "Regal LA Live", "Landmark Theaters", "Alamo Drafthouse", "Arclight Hollywood"];
    theaterNames.forEach(name => this.createTheater({ name, location: "Los Angeles, CA" }));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserID++;
    const now = new Date();
    const user: User = { 
      ...insertUser,
      id, 
      popcornCount: 0, 
      createdAt: now,
      displayName: insertUser.displayName ?? null,
      bio: insertUser.bio ?? null,
      location: insertUser.location ?? null,
      avatarUrl: insertUser.avatarUrl ?? null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updatePopcornCount(userId: number, count: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, popcornCount: count };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Movie methods
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }
  
  async getMovieByTitle(title: string): Promise<Movie | undefined> {
    return Array.from(this.movies.values()).find(
      (movie) => movie.title.toLowerCase() === title.toLowerCase()
    );
  }
  
  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = this.currentMovieID++;
    const now = new Date();
    const movie: Movie = { 
      ...insertMovie, 
      id, 
      createdAt: now,
      posterUrl: insertMovie.posterUrl ?? null,
      backdropUrl: insertMovie.backdropUrl ?? null,
      overview: insertMovie.overview ?? null,
      runtime: insertMovie.runtime ?? null,
      rating: insertMovie.rating ?? null,
      tmdbId: insertMovie.tmdbId ?? null
    };
    this.movies.set(id, movie);
    return movie;
  }
  
  async getPopularMovies(limit: number = 10): Promise<Movie[]> {
    // In a real database, we would sort by rating or views
    return Array.from(this.movies.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }
  
  async getRecentMovies(limit: number = 10): Promise<Movie[]> {
    // Sort by creation date
    return Array.from(this.movies.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }
  
  async searchMovies(term: string): Promise<Movie[]> {
    const lowerTerm = term.toLowerCase();
    return Array.from(this.movies.values()).filter(
      (movie) => movie.title.toLowerCase().includes(lowerTerm)
    );
  }
  
  // Genre methods
  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }
  
  async getGenreByName(name: string): Promise<Genre | undefined> {
    return Array.from(this.genres.values()).find(
      (genre) => genre.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async createGenre(insertGenre: InsertGenre): Promise<Genre> {
    const id = this.currentGenreID++;
    const genre: Genre = { ...insertGenre, id };
    this.genres.set(id, genre);
    return genre;
  }
  
  async getMovieGenres(movieId: number): Promise<Genre[]> {
    const genreIds = Array.from(this.movieGenres.values())
      .filter(mg => mg.movieId === movieId)
      .map(mg => mg.genreId);
    
    return genreIds.reduce<Genre[]>((acc, genreId) => {
      const genre = this.genres.get(genreId);
      if (genre) acc.push(genre);
      return acc;
    }, []);
  }
  
  // MovieGenre methods
  async addGenreToMovie(data: InsertMovieGenre): Promise<MovieGenre> {
    const id = this.currentMovieGenreID++;
    const movieGenre: MovieGenre = { ...data, id };
    this.movieGenres.set(id, movieGenre);
    return movieGenre;
  }
  
  // Watched methods
  async getWatched(id: number): Promise<Watched | undefined> {
    return this.watchedMovies.get(id);
  }
  
  async createWatched(insertWatched: InsertWatched): Promise<Watched> {
    const id = this.currentWatchedID++;
    const now = new Date();
    const watched: Watched = { 
      ...insertWatched,
      id, 
      watchedAt: now,
      theater: insertWatched.theater ?? null,
      theaterAuditorium: insertWatched.theaterAuditorium ?? null,
      ticketCount: insertWatched.ticketCount ?? null,
      seats: insertWatched.seats ?? null,
      showtime: insertWatched.showtime ?? null,
      timezone: insertWatched.timezone ?? null,
      userRating: insertWatched.userRating ?? null,
      review: insertWatched.review ?? null
    };
    this.watchedMovies.set(id, watched);
    return watched;
  }
  
  async getUserWatched(userId: number, limit: number = 10): Promise<Watched[]> {
    return Array.from(this.watchedMovies.values())
      .filter(w => w.userId === userId)
      .sort((a, b) => (b.watchedAt?.getTime() || 0) - (a.watchedAt?.getTime() || 0))
      .slice(0, limit);
  }
  
  async getMovieWatches(movieId: number): Promise<Watched[]> {
    return Array.from(this.watchedMovies.values())
      .filter(w => w.movieId === movieId)
      .sort((a, b) => (b.watchedAt?.getTime() || 0) - (a.watchedAt?.getTime() || 0));
  }
  
  async getUserMovieStats(userId: number): Promise<{ 
    totalMovies: number;
    thisMonth: number;
    theaters: number;
    reviews: number;
  }> {
    const userWatched = Array.from(this.watchedMovies.values())
      .filter(w => w.userId === userId);
    
    const now = new Date();
    const thisMonth = userWatched.filter(w => {
      const watchedDate = w.watchedAt;
      return watchedDate && 
             watchedDate.getMonth() === now.getMonth() && 
             watchedDate.getFullYear() === now.getFullYear();
    });
    
    const uniqueTheaters = new Set(userWatched.map(w => w.theater).filter(Boolean));
    const reviews = userWatched.filter(w => w.review && w.review.trim() !== '');
    
    return {
      totalMovies: userWatched.length,
      thisMonth: thisMonth.length,
      theaters: uniqueTheaters.size,
      reviews: reviews.length
    };
  }
  
  async getUserGenreStats(userId: number): Promise<{ name: string; percentage: number }[]> {
    const userWatched = Array.from(this.watchedMovies.values())
      .filter(w => w.userId === userId);
    
    if (userWatched.length === 0) return [];
    
    const genreCounts: Record<string, number> = {};
    const totalCount = userWatched.length;
    
    // Count genres for each watched movie
    for (const watch of userWatched) {
      const genres = await this.getMovieGenres(watch.movieId);
      for (const genre of genres) {
        genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
      }
    }
    
    // Convert to percentage
    return Object.entries(genreCounts)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalCount) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
  
  // Theater methods
  async getTheater(id: number): Promise<Theater | undefined> {
    return this.theaters.get(id);
  }
  
  async getTheaterByName(name: string): Promise<Theater | undefined> {
    return Array.from(this.theaters.values()).find(
      (theater) => theater.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async createTheater(insertTheater: InsertTheater): Promise<Theater> {
    const id = this.currentTheaterID++;
    const theater: Theater = { 
      ...insertTheater, 
      id,
      location: insertTheater.location ?? null
    };
    this.theaters.set(id, theater);
    return theater;
  }
  
  async getUserTheaterVisits(userId: number): Promise<{ 
    id: number; 
    name: string; 
    visits: number; 
    averageRating: number;
  }[]> {
    const userWatched = Array.from(this.watchedMovies.values())
      .filter(w => w.userId === userId && w.theater);
    
    const theaterStats: Record<string, { visits: number; ratings: number[] }> = {};
    
    // Group by theater
    for (const watch of userWatched) {
      if (!watch.theater) continue;
      
      if (!theaterStats[watch.theater]) {
        theaterStats[watch.theater] = { visits: 0, ratings: [] };
      }
      
      theaterStats[watch.theater].visits += 1;
      if (watch.userRating !== null && watch.userRating !== undefined) {
        theaterStats[watch.theater].ratings.push(watch.userRating);
      }
    }
    
    // Calculate stats and find theater records
    const result: { id: number; name: string; visits: number; averageRating: number; }[] = [];
    
    for (const [theaterName, stats] of Object.entries(theaterStats)) {
      const theater = await this.getTheaterByName(theaterName);
      if (!theater) continue;
      
      const averageRating = stats.ratings.length > 0 
        ? stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length
        : 0;
      
      result.push({
        id: theater.id,
        name: theater.name,
        visits: stats.visits,
        averageRating: Math.round(averageRating * 10) / 10
      });
    }
    
    return result.sort((a, b) => b.visits - a.visits);
  }
}

export const storage = new MemStorage();
