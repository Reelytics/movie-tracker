import { 
  users, type User, type InsertUser,
  movies, type Movie, type InsertMovie,
  watchedMovies, type WatchedMovie, type InsertWatchedMovie,
  favorites, type Favorite, type InsertFavorite,
  type UserStats, type WatchedMovieWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Movie operations
  getMovie(id: number): Promise<Movie | undefined>;
  getMovieByTmdbId(tmdbId: number): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  
  // Watched movies operations
  getWatchedMovies(userId: number): Promise<WatchedMovieWithDetails[]>;
  getWatchedMovie(id: number): Promise<WatchedMovie | undefined>;
  createWatchedMovie(watchedMovie: InsertWatchedMovie): Promise<WatchedMovie>;
  updateWatchedMovie(id: number, watchedMovie: Partial<InsertWatchedMovie>): Promise<WatchedMovie | undefined>;
  deleteWatchedMovie(id: number): Promise<boolean>;
  
  // Favorites operations
  getFavorites(userId: number): Promise<WatchedMovieWithDetails[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, movieId: number): Promise<boolean>;
  
  // Stats
  getUserStats(userId: number): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private movies: Map<number, Movie>;
  private watchedMovies: Map<number, WatchedMovie>;
  private favorites: Map<number, Favorite>;
  
  private currentUserId: number;
  private currentMovieId: number;
  private currentWatchedMovieId: number;
  private currentFavoriteId: number;
  
  constructor() {
    this.users = new Map();
    this.movies = new Map();
    this.watchedMovies = new Map();
    this.favorites = new Map();
    
    this.currentUserId = 1;
    this.currentMovieId = 1;
    this.currentWatchedMovieId = 1;
    this.currentFavoriteId = 1;
    
    // Add default user
    this.users.set(1, {
      id: 1,
      username: "film_enthusiast",
      password: "password123",
      fullName: "Emma Johnson",
      bio: "Film critic | Noir enthusiast | Collecting memorable cinema moments since 2018",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80"
    });
    this.currentUserId++;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Movie operations
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }
  
  async getMovieByTmdbId(tmdbId: number): Promise<Movie | undefined> {
    return Array.from(this.movies.values()).find(
      (movie) => movie.tmdbId === tmdbId,
    );
  }
  
  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = this.currentMovieId++;
    const movie: Movie = { ...insertMovie, id };
    this.movies.set(id, movie);
    return movie;
  }
  
  // Watched movies operations
  async getWatchedMovies(userId: number): Promise<WatchedMovieWithDetails[]> {
    const userWatchedMovies = Array.from(this.watchedMovies.values()).filter(
      (wm) => wm.userId === userId,
    );
    
    return userWatchedMovies.map(wm => {
      const movie = this.movies.get(wm.movieId);
      if (!movie) throw new Error(`Movie with id ${wm.movieId} not found`);
      
      return {
        id: wm.id,
        movie,
        rating: wm.rating || null,
        review: wm.review || null,
        favorite: wm.favorite || false,
        watchedAt: wm.watchedAt,
      };
    }).sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
  }
  
  async getWatchedMovie(id: number): Promise<WatchedMovie | undefined> {
    return this.watchedMovies.get(id);
  }
  
  async createWatchedMovie(insertWatchedMovie: InsertWatchedMovie): Promise<WatchedMovie> {
    const id = this.currentWatchedMovieId++;
    const watchedMovie: WatchedMovie = { ...insertWatchedMovie, id };
    this.watchedMovies.set(id, watchedMovie);
    return watchedMovie;
  }
  
  async updateWatchedMovie(
    id: number, 
    watchedMovieUpdate: Partial<InsertWatchedMovie>
  ): Promise<WatchedMovie | undefined> {
    const watchedMovie = this.watchedMovies.get(id);
    if (!watchedMovie) return undefined;
    
    const updatedWatchedMovie = { ...watchedMovie, ...watchedMovieUpdate };
    this.watchedMovies.set(id, updatedWatchedMovie);
    return updatedWatchedMovie;
  }
  
  async deleteWatchedMovie(id: number): Promise<boolean> {
    return this.watchedMovies.delete(id);
  }
  
  // Favorites operations
  async getFavorites(userId: number): Promise<WatchedMovieWithDetails[]> {
    const watchedMovies = await this.getWatchedMovies(userId);
    return watchedMovies.filter(wm => wm.favorite);
  }
  
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const favorite: Favorite = { ...insertFavorite, id, createdAt: new Date() };
    this.favorites.set(id, favorite);
    
    // Also update the watchedMovie if exists
    const existingWatchedMovies = Array.from(this.watchedMovies.values()).filter(
      wm => wm.userId === insertFavorite.userId && wm.movieId === insertFavorite.movieId
    );
    
    if (existingWatchedMovies.length > 0) {
      for (const wm of existingWatchedMovies) {
        this.updateWatchedMovie(wm.id, { favorite: true });
      }
    }
    
    return favorite;
  }
  
  async removeFavorite(userId: number, movieId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      f => f.userId === userId && f.movieId === movieId
    );
    
    if (!favorite) return false;
    
    // Also update the watchedMovie if exists
    const existingWatchedMovies = Array.from(this.watchedMovies.values()).filter(
      wm => wm.userId === userId && wm.movieId === movieId
    );
    
    if (existingWatchedMovies.length > 0) {
      for (const wm of existingWatchedMovies) {
        this.updateWatchedMovie(wm.id, { favorite: false });
      }
    }
    
    return this.favorites.delete(favorite.id);
  }
  
  // Stats
  async getUserStats(userId: number): Promise<UserStats> {
    const watchedMovies = Array.from(this.watchedMovies.values()).filter(
      wm => wm.userId === userId
    );
    
    const favorites = Array.from(this.favorites.values()).filter(
      f => f.userId === userId
    );
    
    const reviews = watchedMovies.filter(wm => wm.review && wm.review.trim() !== '');
    
    return {
      watched: watchedMovies.length,
      favorites: favorites.length,
      reviews: reviews.length,
      followers: 283, // Mock value for now
    };
  }
}

export const storage = new MemStorage();
