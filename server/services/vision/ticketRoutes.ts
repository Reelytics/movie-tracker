import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import ticketScannerService from '../vision/ticketScannerService';
import { eq } from 'drizzle-orm';
import visionProviderRegistry from '../vision/visionProviderRegistry';

// Extend the session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    latestScannedTicket?: any;
  }
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `ticket-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Create upload middleware with file type filtering
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp|tiff/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed'));
  }
});

// Create router
const router = express.Router();

/**
 * Route to scan a ticket image and extract data
 */
router.post('/scan', upload.single('ticketImage'), async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const imagePath = req.file.path;
    
    // Get the specified provider (default to Gemini)
    const providerName = req.body.provider || 'Google Gemini Vision';
    
    console.log(`Scanning ticket with provider: ${providerName}`);
    console.log(`Image path: ${imagePath}`);
    
    // Scan the ticket using AI vision
    const ticketData = await ticketScannerService.scanTicket(userId, imagePath, providerName);
    
    if (!ticketData) {
      return res.status(400).json({ error: 'Failed to extract information from the ticket image' });
    }
    
    // Validate the extracted data
    if (!ticketScannerService.validateTicketData(ticketData)) {
      return res.status(400).json({
        error: 'Could not extract enough information from the ticket',
        partialData: ticketData
      });
    }
    
    // Store the scanned ticket in session for later retrieval
    if (req.session) {
      req.session.latestScannedTicket = ticketData;
    }
    
    // Set the image path in a header for the client
    res.set('X-Ticket-Image-Path', imagePath);
    
    // Return the parsed data without saving yet
    res.json({
      message: 'Ticket successfully scanned',
      data: ticketData,
      provider: providerName || visionProviderRegistry.getActiveProvider()?.name
    });
    
  } catch (error) {
    console.error('Error in ticket scan route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Error processing ticket image: ' + errorMessage });
  }
});

/**
 * Route to save ticket data after confirmation
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const ticketData = req.body;
    
    console.log('Received ticket data for saving:', ticketData);
    
    // Ensure ticket data has the user ID
    ticketData.userId = userId;
    
    // Save the ticket
    const insertedTicket = await db.insert(schema.movieTickets).values(ticketData).returning();
    
    if (!insertedTicket || insertedTicket.length === 0) {
      return res.status(500).json({ error: 'Failed to save ticket data' });
    }
    
    res.json({
      message: 'Ticket saved successfully',
      data: insertedTicket[0]
    });
    
  } catch (error) {
    console.error('Error in ticket save route:', error);
    res.status(500).json({ error: 'Error saving ticket data: ' + error.message });
  }
});

/**
 * Route to set the active vision provider
 */
router.post('/providers/set-active', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { providerName } = req.body;
    
    if (!providerName) {
      return res.status(400).json({ error: 'Provider name is required' });
    }
    
    const success = ticketScannerService.setActiveProvider(providerName);
    
    if (success) {
      res.json({
        message: `Provider "${providerName}" set as active`,
        active: providerName
      });
    } else {
      res.status(400).json({
        error: `Provider "${providerName}" not found`
      });
    }
    
  } catch (error) {
    console.error('Error setting active provider:', error);
    res.status(500).json({ error: 'Error setting active provider: ' + error.message });
  }
});

/**
 * Route to get user's tickets
 */
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Get all tickets for the user
    const userTickets = await db.query.movieTickets.findMany({
      where: eq(schema.movieTickets.userId, userId),
      orderBy: (movieTickets, { desc }) => [desc(movieTickets.createdAt)]
    });
    
    res.json(userTickets);
    
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Error fetching ticket data: ' + error.message });
  }
});

/**
 * Route to get available vision providers and their status
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const providersStatus = await ticketScannerService.getProvidersStatus();
    
    res.json({
      providers: providersStatus
    });
    
  } catch (error) {
    console.error('Error fetching provider status:', error);
    res.status(500).json({ error: 'Error fetching providers: ' + error.message });
  }
});

/**
 * Route to test all providers
 */
router.get('/providers/test', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const testResults = await visionProviderRegistry.testAllProviders();
    
    res.json({
      results: Array.from(testResults.entries()).map(([name, status]) => ({
        name,
        status: status ? 'connected' : 'failed'
      }))
    });
    
  } catch (error) {
    console.error('Error testing providers:', error);
    res.status(500).json({ error: 'Error testing providers: ' + error.message });
  }
});

/**
 * Route to get the latest scanned ticket
 */
router.get('/latest-scan', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Get the latest scanned ticket from session or cache
    // This is a fallback for when navigation state is lost
    if (req.session && req.session.latestScannedTicket) {
      return res.json({
        message: 'Latest scanned ticket retrieved',
        data: req.session.latestScannedTicket
      });
    }
    
    // If no scanned ticket in session, return error
    return res.status(404).json({ error: 'No recent ticket scan found' });
    
  } catch (error) {
    console.error('Error getting latest scanned ticket:', error);
    res.status(500).json({ error: 'Error getting latest ticket: ' + error.message });
  }
});

/**
 * Route to get a specific ticket
 */
router.get('/ticket/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Request started`);
  
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Authentication failed`);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Invalid ticket ID format`);
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Get the ticket
    console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Querying database`);
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(schema.movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Ticket not found`);
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Permission denied. Ticket owned by ${ticket.userId}, requested by ${userId}`);
      return res.status(403).json({ error: 'You do not have permission to view this ticket' });
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Request completed in ${responseTime}ms`);
    
    return res.json(ticket);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] GET /ticket/${req.params.id} - Error in ${responseTime}ms:`, error);
    
    // Prevent hanging requests by ensuring a response is sent
    return res.status(500).json({ 
      error: 'Error fetching ticket',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Route to delete a ticket
 */
router.delete('/ticket/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Request started`);
  
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Authentication failed`);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Invalid ticket ID format`);
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Get the ticket to verify ownership
    console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Querying database`);
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(schema.movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Ticket not found`);
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Permission denied. Ticket owned by ${ticket.userId}, requested by ${userId}`);
      return res.status(403).json({ error: 'You do not have permission to delete this ticket' });
    }
    
    // Delete the ticket
    console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Deleting from database`);
    await db.delete(schema.movieTickets).where(eq(schema.movieTickets.id, ticketId));
    
    // If the ticket has an image, delete it
    if (ticket.ticketImagePath) {
      try {
        console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Deleting image file: ${ticket.ticketImagePath}`);
        fs.unlinkSync(ticket.ticketImagePath);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Error deleting image:`, err);
        // Continue anyway, the record is deleted
      }
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Request completed in ${responseTime}ms`);
    
    return res.status(204).end();
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] DELETE /ticket/${req.params.id} - Error in ${responseTime}ms:`, error);
    
    // Prevent hanging requests by ensuring a response is sent
    return res.status(500).json({ 
      error: 'Error deleting ticket',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Route to get a specific ticket (alias to support old endpoint pattern)
 * IMPORTANT: This must be the LAST route defined to avoid catching other routes
 */
router.get('/:id', async (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] GET /:id - Deprecated route accessed, redirecting to /ticket/:id`);
  
  try {
    // Check if this is really a numeric ID and not another path
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      console.log(`[${new Date().toISOString()}] GET /:id - Not a numeric ID, skipping redirect: ${req.params.id}`);
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Direct response without redirect to avoid client-side redirects
    console.log(`[${new Date().toISOString()}] GET /:id with ID ${ticketId} - Proxying to /ticket/:id endpoint`);
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Get the ticket
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(schema.movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this ticket' });
    }
    
    return res.json(ticket);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /:id - Error:`, error);
    
    // Ensure a response is sent
    return res.status(500).json({ 
      error: 'Error fetching ticket',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Route alias for deleting a ticket using old endpoint pattern
 * IMPORTANT: This must be the LAST route defined to avoid catching other routes
 */
router.delete('/:id', async (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] DELETE /:id - Deprecated route accessed`);
  
  try {
    // Check if this is really a numeric ID and not another path
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      console.log(`[${new Date().toISOString()}] DELETE /:id - Not a numeric ID, skipping: ${req.params.id}`);
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Direct handling instead of redirect
    console.log(`[${new Date().toISOString()}] DELETE /:id with ID ${ticketId} - Proxying to /ticket/:id endpoint`);
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Get the ticket to verify ownership
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(schema.movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this ticket' });
    }
    
    // Delete the ticket
    await db.delete(schema.movieTickets).where(eq(schema.movieTickets.id, ticketId));
    
    // If the ticket has an image, delete it
    if (ticket.ticketImagePath) {
      try {
        fs.unlinkSync(ticket.ticketImagePath);
      } catch (err) {
        console.error('Error deleting ticket image:', err);
        // Continue anyway, the record is deleted
      }
    }
    
    return res.status(204).end();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /:id - Error:`, error);
    
    // Ensure a response is sent
    return res.status(500).json({ 
      error: 'Error deleting ticket',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
