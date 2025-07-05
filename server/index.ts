import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log('=== STARTING REELYTICS SERVER ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  try {
    console.log('=== STARTING SERVER SETUP ===');
    
    // Add health check endpoint
    app.get('/health', (req, res) => {
      console.log('Health check requested');
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        database: !!process.env.DATABASE_URL
      });
    });

    // Add root endpoint for basic testing
    app.get('/', (req, res) => {
      console.log('Root endpoint requested');
      res.status(200).json({ 
        message: 'Reelytics API is running',
        timestamp: new Date().toISOString()
      });
    });

    console.log('=== REGISTERING ROUTES ===');
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error handler:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error details:', { status, message, stack: err.stack });
  });

  console.log('=== SETTING UP STATIC/VITE ===');
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log('Setting up Vite for development');
    await setupVite(app, server);
  } else {
    console.log('Setting up static serving for production');
    serveStatic(app);
  }

  console.log('=== STARTING SERVER LISTEN ===');
  // ALWAYS serve the app on port 5000 in development, Railway PORT in production
  // this serves both the API and the client.
  const port = process.env.PORT || 5000;
  console.log(`Attempting to listen on port: ${port}`);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log('=== SERVER STARTED SUCCESSFULLY ===');
    log(`serving on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log('Health endpoint available at: /health');
    console.log('Root endpoint available at: /');
    console.log('=== READY FOR REQUESTS ===');
  });
  
  } catch (error) {
    console.error('=== SERVER STARTUP FAILED ===');
    console.error('Error during server setup:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
})().catch((error) => {
  console.error('=== UNHANDLED SERVER ERROR ===');
  console.error('Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  console.error('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT SET]'
  });
  process.exit(1);
});
