import express from 'express';
import fs from 'fs';
import path from 'path';
import { log } from './vite';

/**
 * This is a patched version of the serveStatic function that properly serves
 * static files in production environments from various potential build locations.
 * 
 * It's implemented as a separate module to avoid modifying the fragile vite.ts file.
 */
export function patchedServeStatic(app: express.Express): void {
  // Try multiple possible locations for static files
  const possiblePaths = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'client/dist')
  ];
  
  let staticPath = '';
  
  // Find the first path that exists and contains an index.html file
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      staticPath = dir;
      log(`Found static files at: ${staticPath}`, 'static-serve');
      break;
    }
  }
  
  if (!staticPath) {
    log('WARNING: No valid static files directory found. Using fallback.', 'static-serve');
    // Create a minimal HTML response as fallback
    app.use('*', (_req, res) => {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reelytics - Build Error</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
            h1 { color: #e11d48; }
          </style>
        </head>
        <body>
          <h1>Static Files Not Found</h1>
          <p>The application couldn't find the necessary static files. Make sure to build the project before deployment.</p>
          <p>Paths checked: ${possiblePaths.join(', ')}</p>
        </body>
        </html>
      `);
    });
    return;
  }
  
  // Configure static file serving
  app.use(express.static(staticPath, {
    maxAge: '1d',  // Cache for 1 day
    etag: true
  }));
  
  // SPA fallback - serve index.html for all unmatched routes
  app.use('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  log(`Static file serving configured from: ${staticPath}`, 'static-serve');
}