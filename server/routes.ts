import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertMovieSchema, 
  insertGenreSchema,
  insertMovieGenreSchema,
  insertWatchedSchema,
  insertTheaterSchema
} from "@shared/schema";
import { ZodError } from "zod";
import * as tmdbService from "./services/tmdb";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for Zod validation
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        next(error);
      }
    };
  };

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  app.post("/api/users", validateRequest(insertUserSchema), async (req, res) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const user = await storage.createUser(req.body);
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  });
  
  app.patch("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate only the fields that are being updated
    const updateData: Record<string, any> = {};
    const allowedFields = ["displayName", "bio", "location", "avatarUrl"];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });
  
  // Movie routes
  app.get("/api/movies", async (req, res) => {
    const { search, limit } = req.query;
    
    let movies;
    if (search && typeof search === 'string') {
      movies = await storage.searchMovies(search);
    } else {
      movies = await storage.getPopularMovies(limit ? parseInt(limit as string) : undefined);
    }
    
    res.json(movies);
  });
  
  app.get("/api/movies/recent", async (req, res) => {
    const { limit } = req.query;
    const movies = await storage.getRecentMovies(
      limit ? parseInt(limit as string) : undefined
    );
    res.json(movies);
  });
  
  app.get("/api/movies/:id", async (req, res) => {
    const movieId = parseInt(req.params.id);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }
    
    const movie = await storage.getMovie(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    res.json(movie);
  });
  
  app.post("/api/movies", validateRequest(insertMovieSchema), async (req, res) => {
    const movie = await storage.createMovie(req.body);
    res.status(201).json(movie);
  });
  
  // Genre routes
  app.get("/api/genres", async (req, res) => {
    // TODO: Implement proper getGenres method in storage
    // For now, just return an empty array
    res.json([]);
  });
  
  app.get("/api/movies/:id/genres", async (req, res) => {
    const movieId = parseInt(req.params.id);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }
    
    const genres = await storage.getMovieGenres(movieId);
    res.json(genres);
  });
  
  app.post("/api/genres", validateRequest(insertGenreSchema), async (req, res) => {
    const existingGenre = await storage.getGenreByName(req.body.name);
    if (existingGenre) {
      return res.status(400).json({ message: "Genre already exists" });
    }
    
    const genre = await storage.createGenre(req.body);
    res.status(201).json(genre);
  });
  
  app.post("/api/movies/:movieId/genres", validateRequest(insertMovieGenreSchema), async (req, res) => {
    const movieId = parseInt(req.params.movieId);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: "Invalid movie ID" });
    }
    
    const movie = await storage.getMovie(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    const { genreId } = req.body;
    const genre = await storage.getGenre(genreId);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }
    
    const movieGenre = await storage.addGenreToMovie({ movieId, genreId });
    res.status(201).json(movieGenre);
  });
  
  // Watched routes
  app.get("/api/users/:userId/watched", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const { limit } = req.query;
    const watched = await storage.getUserWatched(
      userId,
      limit ? parseInt(limit as string) : undefined
    );
    
    // Enrich with movie data
    const enrichedWatched = await Promise.all(watched.map(async (w) => {
      const movie = await storage.getMovie(w.movieId);
      return { ...w, movie };
    }));
    
    res.json(enrichedWatched);
  });
  
  app.post("/api/watched", validateRequest(insertWatchedSchema), async (req, res) => {
    const { userId, movieId } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const movie = await storage.getMovie(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    const watched = await storage.createWatched(req.body);
    
    // Update user's popcorn count
    await storage.updatePopcornCount(userId, (user.popcornCount || 0) + 1);
    
    res.status(201).json(watched);
  });
  
  // Stats routes
  app.get("/api/users/:userId/stats", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const movieStats = await storage.getUserMovieStats(userId);
    const genreStats = await storage.getUserGenreStats(userId);
    const theaterStats = await storage.getUserTheaterVisits(userId);
    
    res.json({
      ...movieStats,
      genreStats,
      theaterStats,
      popcornCount: user.popcornCount || 0
    });
  });
  
  // Theater routes
  app.post("/api/theaters", validateRequest(insertTheaterSchema), async (req, res) => {
    const existingTheater = await storage.getTheaterByName(req.body.name);
    if (existingTheater) {
      return res.status(400).json({ message: "Theater already exists" });
    }
    
    const theater = await storage.createTheater(req.body);
    res.status(201).json(theater);
  });
  
  // TMDB API Routes
  app.get("/api/tmdb/search", async (req, res) => {
    try {
      const { query, page } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const pageNum = page ? parseInt(page as string) : 1;
      const searchResults = await tmdbService.searchMovies(query, pageNum);
      
      // Format the results to match our app's movie format
      const formattedResults = searchResults.results.map(movie => ({
        tmdbId: movie.id,
        title: movie.title,
        year: tmdbService.extractYearFromDate(movie.release_date),
        posterUrl: tmdbService.getFullImagePath(movie.poster_path),
        backdropUrl: tmdbService.getFullImagePath(movie.backdrop_path, 'w1280'),
        overview: movie.overview
      }));
      
      res.json({
        results: formattedResults,
        page: searchResults.page,
        totalPages: searchResults.total_pages,
        totalResults: searchResults.total_results
      });
    } catch (error) {
      console.error('TMDB search error:', error);
      res.status(500).json({ message: 'Failed to search movies', error: (error as Error).message });
    }
  });
  
  app.get("/api/tmdb/movie/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movieDetails = await tmdbService.getMovieDetails(movieId);
      const formattedMovie = tmdbService.convertTMDBMovieToInsertMovie(movieDetails);
      
      // Also include the original TMDB data for reference
      res.json({
        movie: formattedMovie,
        tmdbData: movieDetails
      });
    } catch (error) {
      console.error('TMDB movie details error:', error);
      res.status(500).json({ message: 'Failed to get movie details', error: (error as Error).message });
    }
  });
  
  app.get("/api/tmdb/nowplaying", async (req, res) => {
    try {
      const { page } = req.query;
      const pageNum = page ? parseInt(page as string) : 1;
      
      const nowPlaying = await tmdbService.getNowPlayingMovies(pageNum);
      
      // Format the results to match our app's movie format
      const formattedResults = nowPlaying.results.map(movie => ({
        tmdbId: movie.id,
        title: movie.title,
        year: tmdbService.extractYearFromDate(movie.release_date),
        posterUrl: tmdbService.getFullImagePath(movie.poster_path),
        backdropUrl: tmdbService.getFullImagePath(movie.backdrop_path, 'w1280'),
        overview: movie.overview
      }));
      
      res.json({
        results: formattedResults,
        page: nowPlaying.page,
        totalPages: nowPlaying.total_pages,
        totalResults: nowPlaying.total_results
      });
    } catch (error) {
      console.error('TMDB now playing error:', error);
      res.status(500).json({ message: 'Failed to get now playing movies', error: (error as Error).message });
    }
  });

  app.get("/api/tmdb/current-month", async (req, res) => {
    try {
      const { page } = req.query;
      const pageNum = page ? parseInt(page as string) : 1;
      
      const currentMonthMovies = await tmdbService.getMoviesReleasedThisMonth(pageNum);
      
      // Format the results to match our app's movie format
      const formattedResults = currentMonthMovies.results.map(movie => ({
        tmdbId: movie.id,
        title: movie.title,
        year: tmdbService.extractYearFromDate(movie.release_date),
        posterUrl: tmdbService.getFullImagePath(movie.poster_path),
        backdropUrl: tmdbService.getFullImagePath(movie.backdrop_path, 'w1280'),
        overview: movie.overview
      }));
      
      res.json({
        results: formattedResults,
        page: currentMonthMovies.page,
        totalPages: currentMonthMovies.total_pages,
        totalResults: currentMonthMovies.total_results
      });
    } catch (error) {
      console.error('TMDB current month movies error:', error);
      res.status(500).json({ message: 'Failed to get current month movies', error: (error as Error).message });
    }
  });
  
  app.post("/api/tmdb/import", async (req, res) => {
    try {
      const { tmdbId } = req.body;
      
      if (!tmdbId || typeof tmdbId !== 'number') {
        return res.status(400).json({ message: "TMDB movie ID is required" });
      }
      
      // Get movie details from TMDB
      const movieDetails = await tmdbService.getMovieDetails(tmdbId);
      
      // Convert to our app's movie format
      const movieToInsert = tmdbService.convertTMDBMovieToInsertMovie(movieDetails);
      
      // Check if movie already exists by title
      let existingMovie = await storage.getMovieByTitle(movieToInsert.title);
      
      if (!existingMovie) {
        // If movie doesn't exist, create it
        existingMovie = await storage.createMovie(movieToInsert);
        
        // Also import the genres if available
        if (movieDetails.genres && movieDetails.genres.length > 0) {
          for (const genre of movieDetails.genres) {
            // Check if genre exists
            let existingGenre = await storage.getGenreByName(genre.name);
            
            if (!existingGenre) {
              // Create genre if it doesn't exist
              existingGenre = await storage.createGenre({ name: genre.name });
            }
            
            // Link genre to movie
            await storage.addGenreToMovie({
              movieId: existingMovie.id,
              genreId: existingGenre.id
            });
          }
        }
      }
      
      res.json(existingMovie);
    } catch (error) {
      console.error('TMDB import error:', error);
      res.status(500).json({ message: 'Failed to import movie', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
