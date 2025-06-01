import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';
import { movieTickets, movies } from '../../../shared/schema';
import ticketParser from './ticketParser';
import { eq } from 'drizzle-orm';

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
    
    // Parse the ticket
    const ticketData = await ticketParser.parseTicket(imagePath, userId);
    
    if (!ticketData) {
      return res.status(400).json({ error: 'Failed to identify a movie ticket in the image' });
    }
    
    // Validate the extracted data
    if (!ticketParser.validateTicketData(ticketData)) {
      return res.status(400).json({
        error: 'Could not extract enough information from the ticket',
        partialData: ticketData
      });
    }
    
    // Return the parsed data without saving yet
    res.json({
      message: 'Ticket successfully scanned',
      data: ticketData
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
    
    // Ensure ticket data has the user ID
    ticketData.userId = userId;
    
    // Try to find or create the movie
    let movieId: number | null = null;
    
    if (ticketData.movieTitle) {
      // Try to find the movie by title
      const existingMovie = await db.query.movies.findFirst({
        where: eq(movies.title, ticketData.movieTitle)
      });
      
      if (existingMovie) {
        movieId = existingMovie.id;
      } else {
        // We couldn't find the movie, but we'll just store the title
        // A more sophisticated implementation might search an external API like TMDB
        ticketData.movieId = null;
      }
    }
    
    // Save the ticket
    const insertedTicket = await db.insert(movieTickets).values(ticketData).returning();
    
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
      where: eq(movieTickets.userId, userId),
      orderBy: (movieTickets, { desc }) => [desc(movieTickets.createdAt)]
    });
    
    res.json(userTickets);
    
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Error fetching ticket data: ' + error.message });
  }
});

/**
 * Route to get a specific ticket
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Get the ticket
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this ticket' });
    }
    
    res.json(ticket);
    
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Error fetching ticket: ' + error.message });
  }
});

/**
 * Route to delete a ticket
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Get the ticket to verify ownership
    const ticket = await db.query.movieTickets.findFirst({
      where: eq(movieTickets.id, ticketId)
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this ticket' });
    }
    
    // Delete the ticket
    await db.delete(movieTickets).where(eq(movieTickets.id, ticketId));
    
    // If the ticket has an image, delete it
    if (ticket.ticketImagePath) {
      const fs = require('fs');
      const path = require('path');
      
      try {
        fs.unlinkSync(ticket.ticketImagePath);
      } catch (err) {
        console.error('Error deleting ticket image:', err);
        // Continue anyway, the record is deleted
      }
    }
    
    res.status(204).end();
    
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Error deleting ticket: ' + error.message });
  }
});

export default router;
