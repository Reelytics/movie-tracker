import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    console.error("Invalid stored password format (missing salt separator):", stored);
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.error("Invalid stored password format (missing hash or salt):", { hashed, salt });
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function createTestUser() {
  try {
    // Check if test user exists
    const existingUser = await storage.getUserByUsername("testuser");
    if (!existingUser) {
      // Create test user with hashed password
      const hashedPassword = await hashPassword("testpassword");
      await storage.createUser({
        username: "testuser",
        passwordHash: hashedPassword,
        email: "test@example.com",
        fullName: "Test User",
        bio: "This is a test user account",
        profilePicture: null
      });
      console.log("Test user created");
    }
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

export function setupAuth(app: Express) {
  // Add security headers and CORS configuration
  app.use((req, res, next) => {
    // Log origin for debugging
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Method:', req.method);
    console.log('Request Cookies:', req.headers.cookie);
    
    // In development, allow the Vite dev server and Replit domains
    const origin = req.headers.origin as string;
    
    if (origin) {
      // Allow any replit.dev domain and local dev servers
      if (origin.includes('replit.dev') || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1')) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      // For requests without origin like Curl from CLI
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Configure session
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "movie-diary-secret",
    resave: false, // Changed from true to false since we're using a proper store
    saveUninitialized: false, // Changed from true to false for better session handling
    rolling: true, // Refresh session with each request
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: 'lax',
      path: '/',
    },
    name: 'reelytics.sid',
    store: storage.sessionStore
  };

  // Add session debugging middleware
  app.use((req, res, next) => {
    console.log('Session Debug:', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated?.(),
      user: req.user?.id,
      cookie: req.session?.cookie
    });
    next();
  });

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        console.log(`User found, comparing passwords for DB format: ${JSON.stringify(user)}`);
        // Note: The User type from schema.ts uses camelCase (passwordHash) 
        // but the DB column is snake_case (password_hash)
        // The DB client provides the property with the camelCase name
        const passwordsMatch = await comparePasswords(password, user.passwordHash);
        
        if (!passwordsMatch) {
          console.log(`Password mismatch for user: ${username}`);
          return done(null, false);
        } else {
          console.log(`Login successful for user: ${username}`);
          return done(null, user);
        }
      } catch (error) {
        console.error(`Login error for user ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.id} (${user.username})`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user with ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User with ID ${id} not found during deserialization`);
      } else {
        console.log(`Successfully deserialized user: ${user.username}`);
      }
      done(null, user || null);
    } catch (error) {
      console.error(`Error deserializing user:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        passwordHash: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const userResponse: any = { ...user };
        delete userResponse.passwordHash; // Don't send the password hash to the client
        res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Save the session before responding
        req.session.save((err) => {
          if (err) return next(err);
          
          console.log("Session saved successfully:", req.sessionID);
          
          // Log session details for debugging
          console.log("Session cookie:", {
            name: sessionSettings.name,
            maxAge: sessionSettings.cookie?.maxAge,
            secure: sessionSettings.cookie?.secure,
            path: sessionSettings.cookie?.path
          });
          
          const userResponse: any = { ...user };
          delete userResponse.passwordHash; // Don't send the password hash to the client
          
          // Add the session ID to the response for debugging
          userResponse.sessionId = req.sessionID;
          
          res.json(userResponse);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - session ID:", req.sessionID);
    console.log("Session user:", req.user);
    console.log("Is authenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: "Not authenticated",
        debug: {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          sessionExpires: req.session?.cookie?.expires
        }
      });
    }
    
    const userResponse: any = { ...req.user };
    delete userResponse.passwordHash; // Don't send the password hash to the client
    res.json(userResponse);
  });
}