import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Check environment variables
function checkEnvironmentVariables() {
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn('The application may not function correctly without these variables.');
  }
  
  // Check for TMDB API key
  if (!process.env.VITE_TMDB_API_KEY) {
    console.warn('Warning: VITE_TMDB_API_KEY is not set. Movie search and details may not work correctly.');
  }
  
  // Check for session secret
  if (!process.env.SESSION_SECRET) {
    console.warn('Warning: SESSION_SECRET is not set. Using default value for development only.');
  }
  
  // Log the current environment
  console.info(`Application starting in ${process.env.NODE_ENV || 'development'} mode`);
}

(async () => {
  // Check environment variables before starting the server
  checkEnvironmentVariables();
  
  // Test database connection
  try {
    // Import database connection test function
    const { testDatabaseConnection } = await import('./db');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('Database connection test failed. Some features may not work correctly.');
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log details about the error for debugging
    console.error(`Error processing request ${req.method} ${req.path}:`, {
      error: err.message,
      stack: err.stack,
      status,
      userId: req.user?.id || 'not authenticated',
      timestamp: new Date().toISOString()
    });

    // For authentication errors, provide a clear message
    if (status === 401) {
      return res.status(401).json({ 
        error: "authentication_required",
        message: "You must be logged in to access this resource"
      });
    }
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    try {
      // Try the original serveStatic first
      serveStatic(app);
      log("Using original serveStatic function");
    } catch (error) {
      // If it fails, fall back to our patched version
      log("Original serveStatic failed, using patched version");
      const { patchedServeStatic } = await import('./static-serve');
      patchedServeStatic(app);
    }
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
