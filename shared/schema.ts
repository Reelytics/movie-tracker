import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
});

// Movie model
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  releaseYear: integer("release_year"),
  overview: text("overview"),
});

// Watched movie records
export const watchedMovies = pgTable("watched_movies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  movieId: integer("movie_id").notNull(),
  rating: doublePrecision("rating"),
  review: text("review"),
  firstImpressions: text("first_impressions"),
  favorite: boolean("favorite").default(false),
  watchedAt: timestamp("watched_at").notNull().defaultNow(),
});

// Favorites
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  movieId: integer("movie_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Followers - users following other users
export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(), // User who is following
  followedId: integer("followed_id").notNull(), // User being followed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true,
  email: true,
  fullName: true,
  bio: true,
  profilePicture: true,
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  tmdbId: true,
  title: true,
  posterPath: true,
  backdropPath: true,
  releaseYear: true,
  overview: true,
});

export const insertWatchedMovieSchema = createInsertSchema(watchedMovies).pick({
  userId: true,
  movieId: true,
  rating: true,
  review: true,
  firstImpressions: true,
  favorite: true,
  watchedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  movieId: true,
});

export const insertFollowerSchema = createInsertSchema(followers).pick({
  followerId: true,
  followedId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

export type InsertWatchedMovie = z.infer<typeof insertWatchedMovieSchema>;
export type WatchedMovie = typeof watchedMovies.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;

// Extended types for API responses
export const userStatsSchema = z.object({
  watched: z.number(),
  favorites: z.number(),
  reviews: z.number(),
  followers: z.number(),
  following: z.number(),
});

export type UserStats = z.infer<typeof userStatsSchema>;

export const userProfileSchema = z.object({
  user: z.object({
    id: z.number(),
    username: z.string(),
    fullName: z.string().nullable(),
    bio: z.string().nullable(),
    profilePicture: z.string().nullable(),
  }),
  stats: userStatsSchema,
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const watchedMovieWithDetailsSchema = z.object({
  id: z.number(),
  movie: z.object({
    id: z.number(),
    tmdbId: z.number(),
    title: z.string(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    releaseYear: z.number().nullable(),
    overview: z.string().nullable(),
  }),
  rating: z.number().nullable(),
  review: z.string().nullable(),
  firstImpressions: z.string().nullable(),
  favorite: z.boolean(),
  watchedAt: z.date(),
});

export type WatchedMovieWithDetails = z.infer<typeof watchedMovieWithDetailsSchema>;
