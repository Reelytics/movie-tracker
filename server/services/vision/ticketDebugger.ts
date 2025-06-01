// Debugger for ticket route issues
import { NextFunction, Request, Response } from 'express';

// Create a debugging middleware for ticket routes
export const ticketDebugger = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Only log ticket-related routes
  if (path.includes('/ticket/') || path.match(/\/\d+$/) || path === '/tickets') {
    console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Request: ${req.method} ${req.originalUrl}`);
    console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - User ID: ${req.user?.id || 'Not authenticated'}`);
    console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Params:`, req.params);
    console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Headers:`, {
      accept: req.headers.accept,
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? '[PRESENT]' : '[ABSENT]'
    });
    
    // Save original end function
    const originalEnd = res.end;
    const chunks: Buffer[] = [];
    
    // Override end function with proper typing
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      
      const statusCode = res.statusCode;
      console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Response Status: ${statusCode}`);
      
      // Log response headers
      console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Response Headers:`, {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length')
      });
      
      // If it's JSON and not too large, log it
      const contentType = res.getHeader('content-type');
      if (contentType && contentType.toString().includes('application/json') && chunks.length > 0) {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          if (body.length < 1000) {
            console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Response Body Preview:`, body);
          } else {
            console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Response Body: [${body.length} bytes]`);
          }
        } catch (e) {
          console.log(`[${new Date().toISOString()}] 🎫 TICKET DEBUG - Error parsing response body:`, e);
        }
      }
      
      // Call original end function with proper argument handling
      if (typeof encoding === 'function') {
        // chunk, callback
        return (originalEnd as any).call(res, chunk, encoding);
      } else if (cb) {
        // chunk, encoding, callback
        return (originalEnd as any).call(res, chunk, encoding, cb);
      } else if (encoding) {
        // chunk, encoding
        return (originalEnd as any).call(res, chunk, encoding);
      } else {
        // just chunk
        return (originalEnd as any).call(res, chunk);
      }
    };
  }
  
  // Continue to the next middleware
  next();
};

export default ticketDebugger;
