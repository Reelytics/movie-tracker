import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertMovieSchema, insertWatchedMovieSchema, userProfileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiRouter = express.Router();

  // Error handling middleware
  const handleError = (err: Error, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // User routes
  apiRouter.get("/users/current", async (req, res) => {
    try {
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      const user = await storage.getUser(defaultUserId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stats = await storage.getUserStats(user.id);
      
      // Filter out sensitive information
      const { password, ...userInfo } = user;
      
      const profile = {
        user: userInfo,
        stats
      };
      
      return res.json(profile);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.patch("/users/current", async (req, res) => {
    try {
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      // Validate the update data
      const updateSchema = insertUserSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(defaultUserId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Filter out sensitive information
      const { password, ...userInfo } = updatedUser;
      
      return res.json(userInfo);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  // Movie routes
  apiRouter.get("/movies/watched", async (req, res) => {
    try {
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      const watchedMovies = await storage.getWatchedMovies(defaultUserId);
      return res.json(watchedMovies);
    } catch (error) {
      handleError(error as Error, res);
    }
  });
  
  apiRouter.get("/movies/favorites", async (req, res) => {
    try {
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      const favorites = await storage.getFavorites(defaultUserId);
      return res.json(favorites);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.post("/movies", async (req, res) => {
    try {
      // Create/get movie
      const movieData = insertMovieSchema.parse(req.body.movie);
      
      // Check if movie already exists
      let movie = await storage.getMovieByTmdbId(movieData.tmdbId);
      
      // If movie doesn't exist, create it
      if (!movie) {
        movie = await storage.createMovie(movieData);
      }
      
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      // Check if movie is already watched
      const existingWatchedMovies = await storage.getWatchedMovies(defaultUserId);
      const isAlreadyWatched = existingWatchedMovies.some(wm => wm.movie.id === movie!.id);
      
      if (isAlreadyWatched) {
        return res.status(400).json({ message: "Movie already in watched list" });
      }
      
      // Add to watched movies
      const watchedMovieData = {
        userId: defaultUserId,
        movieId: movie.id,
        rating: req.body.rating || null,
        review: req.body.review || null,
        favorite: req.body.favorite || false,
        watchedAt: req.body.watchedAt ? new Date(req.body.watchedAt) : new Date(),
      };
      
      const watchedMovie = await storage.createWatchedMovie(watchedMovieData);
      
      // If marked as favorite, add to favorites as well
      if (watchedMovieData.favorite) {
        await storage.addFavorite({
          userId: defaultUserId,
          movieId: movie.id,
        });
      }
      
      return res.status(201).json({ 
        id: watchedMovie.id,
        movie,
        ...watchedMovie 
      });
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.patch("/movies/watched/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get existing watched movie
      const existingWatchedMovie = await storage.getWatchedMovie(id);
      if (!existingWatchedMovie) {
        return res.status(404).json({ message: "Watched movie not found" });
      }
      
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      // Check user ownership
      if (existingWatchedMovie.userId !== defaultUserId) {
        return res.status(403).json({ message: "Not authorized to update this record" });
      }
      
      // Validate update data
      const updateSchema = insertWatchedMovieSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // Remove fields that shouldn't be updated
      delete updateData.userId;
      delete updateData.movieId;
      
      // Update watched movie
      const updatedWatchedMovie = await storage.updateWatchedMovie(id, updateData);
      
      // Handle favorite status if changed
      if (typeof updateData.favorite !== 'undefined') {
        if (updateData.favorite) {
          await storage.addFavorite({
            userId: defaultUserId,
            movieId: existingWatchedMovie.movieId,
          });
        } else {
          await storage.removeFavorite(defaultUserId, existingWatchedMovie.movieId);
        }
      }
      
      return res.json(updatedWatchedMovie);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.delete("/movies/watched/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get existing watched movie
      const existingWatchedMovie = await storage.getWatchedMovie(id);
      if (!existingWatchedMovie) {
        return res.status(404).json({ message: "Watched movie not found" });
      }
      
      // For simplicity, we're using the default user
      const defaultUserId = 1;
      
      // Check user ownership
      if (existingWatchedMovie.userId !== defaultUserId) {
        return res.status(403).json({ message: "Not authorized to delete this record" });
      }
      
      // Remove from watched movies
      const deleted = await storage.deleteWatchedMovie(id);
      
      // Also remove from favorites if present
      await storage.removeFavorite(defaultUserId, existingWatchedMovie.movieId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete watched movie" });
      }
      
      return res.status(204).end();
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  // Register the API router
  app.use("/api", apiRouter);

  return httpServer;
}
