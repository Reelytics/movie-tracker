import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  popcornCount: integer("popcorn_count").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  overview: text("overview"),
  runtime: integer("runtime"),
  rating: integer("rating"),
  tmdbId: integer("tmdb_id").unique(),
  createdAt: timestamp("created_at").defaultNow()
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});

export const movieGenres = pgTable("movie_genres", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  genreId: integer("genre_id").notNull()
});

export const watched = pgTable("watched", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  movieId: integer("movie_id").notNull(),
  theater: text("theater"),
  watchedAt: timestamp("watched_at").defaultNow(),
  userRating: integer("user_rating"),
  review: text("review")
});

export const theaters = pgTable("theaters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location")
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
  location: true,
  avatarUrl: true
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  title: true,
  year: true,
  posterUrl: true,
  backdropUrl: true,
  overview: true,
  runtime: true,
  rating: true,
  tmdbId: true
});

export const insertGenreSchema = createInsertSchema(genres).pick({
  name: true
});

export const insertMovieGenreSchema = createInsertSchema(movieGenres).pick({
  movieId: true,
  genreId: true
});

export const insertWatchedSchema = createInsertSchema(watched).pick({
  userId: true,
  movieId: true,
  theater: true,
  userRating: true,
  review: true
});

export const insertTheaterSchema = createInsertSchema(theaters).pick({
  name: true,
  location: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertMovieGenre = z.infer<typeof insertMovieGenreSchema>;
export type MovieGenre = typeof movieGenres.$inferSelect;

export type InsertWatched = z.infer<typeof insertWatchedSchema>;
export type Watched = typeof watched.$inferSelect;

export type InsertTheater = z.infer<typeof insertTheaterSchema>;
export type Theater = typeof theaters.$inferSelect;
