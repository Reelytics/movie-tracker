import { 
  users, type User, type InsertUser,
  movies, type Movie, type InsertMovie,
  watchedMovies, type WatchedMovie, type InsertWatchedMovie,
  favorites, type Favorite, type InsertFavorite,
  followers, type Follower, type InsertFollower,
  type UserStats, type WatchedMovieWithDetails,
  movieTickets, type MovieTicket
} from "@shared/schema";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { db } from './db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { Pool } from 'pg';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  
  // Follower operations
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  followUser(follower: InsertFollower): Promise<Follower>;
  unfollowUser(followerId: number, followedId: number): Promise<boolean>;
  isFollowing(followerId: number, followedId: number): Promise<boolean>;
  
  // Ticket operations
  getTicket(id: number): Promise<MovieTicket | undefined>;
  
  // Stats
  getUserStats(userId: number): Promise<UserStats>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private pool: Pool;
  
  constructor() {
    // Create a new pg pool for sessions
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Create PostgreSQL session store
    const PostgresStore = pgSession(session);
    this.sessionStore = new PostgresStore({
      pool: this.pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    });
    console.log("PostgreSQL session store initialized");
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Movie operations
  async getMovie(id: number): Promise<Movie | undefined> {
    const [movie] = await db.select().from(movies).where(eq(movies.id, id));
    return movie;
  }
  
  async getMovieByTmdbId(tmdbId: number): Promise<Movie | undefined> {
    const [movie] = await db.select().from(movies).where(eq(movies.tmdbId, tmdbId));
    return movie;
  }
  
  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const [movie] = await db.insert(movies).values(insertMovie).returning();
    return movie;
  }
  
  // Watched movies operations
  async getWatchedMovies(userId: number): Promise<WatchedMovieWithDetails[]> {
    // Get all watched movies for this user
    const userWatchedMovies = await db
      .select()
      .from(watchedMovies)
      .where(eq(watchedMovies.userId, userId));
    
    if (userWatchedMovies.length === 0) {
      return [];
    }
    
    // Get all movies that are in the watched list
    const movieIds = userWatchedMovies.map((wm: WatchedMovie) => wm.movieId);
    
    // We can't use eq with an array, so we'll use the in operator from drizzle-orm
    const moviesData = await db
      .select()
      .from(movies)
      .where(inArray(movies.id, movieIds));
    
    const moviesMap = new Map(moviesData.map((movie: Movie) => [movie.id, movie]));
    
    // Get all favorites for this user to check which movies are favorited
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favoriteMovieIds = new Set(userFavorites.map((fav: Favorite) => fav.movieId));
    
    // Map the results to include the movie details and favorite status
    return userWatchedMovies.map((wm: WatchedMovie) => {
      const movie = moviesMap.get(wm.movieId);
      if (!movie) throw new Error(`Movie with id ${wm.movieId} not found`);
      
      return {
        id: wm.id,
        userId: wm.userId,
        movie,
        rating: wm.rating || null,
        review: wm.review || null,
        firstImpressions: wm.firstImpressions || null,
        favorite: favoriteMovieIds.has(wm.movieId),
        watchedAt: wm.watchedAt,
      };
    }).sort((a: WatchedMovieWithDetails, b: WatchedMovieWithDetails) => 
      new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  }
  
  async getWatchedMovie(id: number): Promise<WatchedMovie | undefined> {
    const [watchedMovie] = await db
      .select()
      .from(watchedMovies)
      .where(eq(watchedMovies.id, id));
    return watchedMovie;
  }
  
  async createWatchedMovie(insertWatchedMovie: InsertWatchedMovie): Promise<WatchedMovie> {
    const [watchedMovie] = await db
      .insert(watchedMovies)
      .values(insertWatchedMovie)
      .returning();
    return watchedMovie;
  }
  
  async updateWatchedMovie(id: number, watchedMovieUpdate: Partial<InsertWatchedMovie>): Promise<WatchedMovie | undefined> {
    console.log(`updateWatchedMovie called with id=${id}, update data:`, watchedMovieUpdate);
    
    try {
      const [updatedWatchedMovie] = await db
        .update(watchedMovies)
        .set(watchedMovieUpdate)
        .where(eq(watchedMovies.id, id))
        .returning();
        
      console.log("Updated watched movie result:", updatedWatchedMovie);
      return updatedWatchedMovie;
    } catch (error) {
      console.error("Error updating watched movie:", error);
      throw error;
    }
  }
  
  async deleteWatchedMovie(id: number): Promise<boolean> {
    const result = await db
      .delete(watchedMovies)
      .where(eq(watchedMovies.id, id))
      .returning({ id: watchedMovies.id });
    return result.length > 0;
  }
  
  // Favorites operations
  async getFavorites(userId: number): Promise<WatchedMovieWithDetails[]> {
    // First, get all watched movies for the user
    const watchedMoviesList = await this.getWatchedMovies(userId);
    
    // Then filter only those that are favorited
    return watchedMoviesList.filter(wm => wm.favorite);
  }
  
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    // Check if the favorite already exists
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, insertFavorite.userId),
          eq(favorites.movieId, insertFavorite.movieId)
        )
      );
      
    if (existingFavorite) {
      return existingFavorite;
    }
    
    // Insert the new favorite
    const [favorite] = await db
      .insert(favorites)
      .values({
        ...insertFavorite,
        createdAt: new Date()
      })
      .returning();
    
    return favorite;
  }
  
  async removeFavorite(userId: number, movieId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.movieId, movieId)
        )
      )
      .returning({ id: favorites.id });
    
    return result.length > 0;
  }
  
  // Follower operations
  async getFollowers(userId: number): Promise<User[]> {
    // Get all users who follow this user
    const followerRelations = await db
      .select()
      .from(followers)
      .where(eq(followers.followedId, userId));
    
    if (followerRelations.length === 0) {
      return [];
    }
    
    // Get the follower user details
    const followerIds = followerRelations.map(f => f.followerId);
    const followerUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, followerIds));
    
    return followerUsers;
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    // Get all users that this user follows
    const followingRelations = await db
      .select()
      .from(followers)
      .where(eq(followers.followerId, userId));
    
    if (followingRelations.length === 0) {
      return [];
    }
    
    // Get the followed user details
    const followedIds = followingRelations.map(f => f.followedId);
    const followedUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, followedIds));
    
    return followedUsers;
  }
  
  async followUser(followerData: InsertFollower): Promise<Follower> {
    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerData.followerId),
          eq(followers.followedId, followerData.followedId)
        )
      );
      
    if (existingFollow) {
      return existingFollow;
    }
    
    // Insert the new follow relationship
    const [follower] = await db
      .insert(followers)
      .values({
        ...followerData,
        createdAt: new Date()
      })
      .returning();
    
    return follower;
  }
  
  async unfollowUser(followerId: number, followedId: number): Promise<boolean> {
    const result = await db
      .delete(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followedId, followedId)
        )
      )
      .returning({ id: followers.id });
    
    return result.length > 0;
  }
  
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const [relation] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followedId, followedId)
        )
      );
    
    return !!relation;
  }
  
  // Stats
  async getUserStats(userId: number): Promise<UserStats> {
    // Count watched movies
    const [watchedCount] = await db
      .select({ count: sql`count(*)` })
      .from(watchedMovies)
      .where(eq(watchedMovies.userId, userId));
    
    // Count favorites
    const [favoritesCount] = await db
      .select({ count: sql`count(*)` })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    // Count reviews (non-null reviews in watched_movies)
    const [reviewsCount] = await db
      .select({ count: sql`count(*)` })
      .from(watchedMovies)
      .where(
        and(
          eq(watchedMovies.userId, userId),
          sql`${watchedMovies.review} IS NOT NULL`
        )
      );
    
    // Count followers (people following this user)
    const [followersCount] = await db
      .select({ count: sql`count(*)` })
      .from(followers)
      .where(eq(followers.followedId, userId));
    
    // Count following (people this user follows)
    const [followingCount] = await db
      .select({ count: sql`count(*)` })
      .from(followers)
      .where(eq(followers.followerId, userId));
    
    return {
      watched: Number(watchedCount.count) || 0,
      favorites: Number(favoritesCount.count) || 0,
      reviews: Number(reviewsCount.count) || 0,
      followers: Number(followersCount.count) || 0,
      following: Number(followingCount.count) || 0,
    };
  }
  
  // Ticket operations
  async getTicket(id: number): Promise<MovieTicket | undefined> {
    try {
      console.log(`[${new Date().toISOString()}] Storage.getTicket(${id}) - Starting query`);
      const [ticket] = await db
        .select()
        .from(movieTickets)
        .where(eq(movieTickets.id, id));
      
      console.log(`[${new Date().toISOString()}] Storage.getTicket(${id}) - Query completed, found: ${!!ticket}`);
      return ticket;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Storage.getTicket(${id}) - Error:`, error);
      throw error;
    }
  }
}

// Import the hash function from auth
import { hashPassword } from './auth';

// Create default user if it doesn't exist
async function initializeDatabase() {
  const storage = new DatabaseStorage();
  try {
    // Check if default user exists
    const existingUser = await storage.getUserByUsername("film_enthusiast");
    if (!existingUser) {
      // Hash the password for the default user
      const hashedPassword = await hashPassword("password123");
      console.log("Created hashed password for default user");
      
      // Create default user
      await storage.createUser({
        username: "film_enthusiast",
        passwordHash: hashedPassword, // Properly hashed password
        email: "emma@example.com",
        fullName: "Emma Johnson",
        bio: "Film critic | Noir enthusiast | Collecting memorable cinema moments since 2018",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80"
      });
      console.log("Default user created");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize the database
initializeDatabase().catch(console.error);

export const storage = new DatabaseStorage();
