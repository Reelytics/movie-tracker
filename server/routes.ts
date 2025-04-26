import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertMovieSchema, insertWatchedMovieSchema, userProfileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, createTestUser } from "./auth";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Create test user for development
  await createTestUser();
  
  const httpServer = createServer(app);
  const apiRouter = express.Router();
  
  // Middleware to check if user is authenticated
  const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated with passport session
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Fallback: Check for custom auth headers (for localStorage-based authentication)
    const userId = req.headers['x-user-id'];
    const userAuth = req.headers['x-user-auth'];
    
    if (userId && userAuth === 'true') {
      try {
        // Get the user from storage
        const user = await storage.getUser(Number(userId));
        if (user) {
          // Set the user on the request
          req.user = user;
          return next();
        }
      } catch (error) {
        console.error("Error authenticating with headers:", error);
      }
    }
    
    return res.status(401).json({ message: "Not authenticated" });
  };

  // Error handling middleware
  const handleError = (err: Error, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Auth routes are now handled in auth.ts
  // We'll skip duplicate definition here to avoid conflicts

  // User routes
  
  apiRouter.get("/users/current", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      const stats = await storage.getUserStats(userId);
      
      // Filter out sensitive information
      const userInfo = { ...req.user };
      delete userInfo.passwordHash;
      
      const profile = {
        user: userInfo,
        stats
      };
      
      return res.json(profile);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.patch("/users/current", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      
      // Validate the update data
      const updateSchema = insertUserSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // Don't allow updating passwordHash directly
      if (updateData.passwordHash) {
        delete updateData.passwordHash;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Filter out sensitive information
      const userInfo: any = { ...updatedUser };
      delete userInfo.passwordHash;
      
      return res.json(userInfo);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  // Movie routes
  apiRouter.get("/movies/watched", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      
      const watchedMovies = await storage.getWatchedMovies(userId);
      return res.json(watchedMovies);
    } catch (error) {
      handleError(error as Error, res);
    }
  });
  
  apiRouter.get("/movies/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      
      const favorites = await storage.getFavorites(userId);
      return res.json(favorites);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.post("/movies", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      
      // Create/get movie
      const movieData = insertMovieSchema.parse(req.body.movie);
      
      // Check if movie already exists
      let movie = await storage.getMovieByTmdbId(movieData.tmdbId);
      
      // If movie doesn't exist, create it
      if (!movie) {
        movie = await storage.createMovie(movieData);
      }
      
      // Check if movie is already watched
      const existingWatchedMovies = await storage.getWatchedMovies(userId);
      const isAlreadyWatched = existingWatchedMovies.some(wm => wm.movie.id === movie!.id);
      
      if (isAlreadyWatched) {
        return res.status(400).json({ message: "Movie already in watched list" });
      }
      
      // Add to watched movies
      const watchedMovieData = {
        userId,
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
          userId,
          movieId: movie.id,
        });
      }
      
      // Create a proper response object
      const responseObj = {
        ...watchedMovie,
        movie
      };
      
      return res.status(201).json(responseObj);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.patch("/movies/watched/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get existing watched movie
      const existingWatchedMovie = await storage.getWatchedMovie(id);
      if (!existingWatchedMovie) {
        return res.status(404).json({ message: "Watched movie not found" });
      }
      
      // Check user ownership
      if (existingWatchedMovie.userId !== userId) {
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
            userId,
            movieId: existingWatchedMovie.movieId,
          });
        } else {
          await storage.removeFavorite(userId, existingWatchedMovie.movieId);
        }
      }
      
      return res.json(updatedWatchedMovie);
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  apiRouter.delete("/movies/watched/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id as number;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get existing watched movie
      const existingWatchedMovie = await storage.getWatchedMovie(id);
      if (!existingWatchedMovie) {
        return res.status(404).json({ message: "Watched movie not found" });
      }
      
      // Check user ownership
      if (existingWatchedMovie.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this record" });
      }
      
      // Remove from watched movies
      const deleted = await storage.deleteWatchedMovie(id);
      
      // Also remove from favorites if present
      await storage.removeFavorite(userId, existingWatchedMovie.movieId);
      
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
