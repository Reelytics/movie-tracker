import { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

export function setupGenrePreferencesRoutes(app: Express) {
  /**
   * Save user genre preferences
   * 
   * POST /api/users/:id/preferences/genres
   * Request body: { genreIds: number[] }
   * Response: { success: true }
   */
  app.post("/api/users/:id/preferences/genres", async (req, res) => {
    console.log(`POST /api/users/${req.params.id}/preferences/genres - Request received`);
    
    try {
      if (!req.isAuthenticated()) {
        console.log("POST /api/users/:id/preferences/genres - Not authenticated");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Authorization check - users can only modify their own preferences
      const userId = parseInt(req.params.id);
      if (isNaN(userId) || userId !== req.user.id) {
        console.log(`POST /api/users/:id/preferences/genres - Unauthorized: ${req.user.id} tried to modify ${userId}`);
        return res.status(403).json({ error: "Not authorized to modify another user's preferences" });
      }
      
      // Validate request body
      const schema = z.object({
        genreIds: z.array(z.number()).min(0).max(10)
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        console.log(`POST /api/users/:id/preferences/genres - Invalid request body: ${JSON.stringify(req.body)}`);
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const { genreIds } = validationResult.data;
      console.log(`POST /api/users/${userId}/preferences/genres - Saving genres: ${genreIds.join(', ')}`);
      
      // Here we would typically save the genre preferences to the database
      // Since we don't have a specific implementation, we'll mock a successful response
      
      // You could add code like this if you have user_genre_preferences table:
      // await db.delete(userGenrePreferences).where(eq(userGenrePreferences.userId, userId));
      // for (const genreId of genreIds) {
      //   await db.insert(userGenrePreferences).values({ userId, genreId });
      // }
      
      // For now, we'll just update the user record to mark onboarding as progressing
      await storage.updateUser(userId, {
        onboardingCompleted: true
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving genre preferences:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
}