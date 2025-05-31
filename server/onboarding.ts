import { Express } from "express";
import { storage } from "./storage";

export function setupOnboardingRoutes(app: Express) {
  // Get onboarding status
  app.get("/api/onboarding/status", async (req, res) => {
    console.log("GET /api/onboarding/status - Request received");
    
    try {
      if (!req.isAuthenticated()) {
        console.log("GET /api/onboarding/status - Not authenticated");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user.id;
      console.log(`GET /api/onboarding/status - Checking status for user: ${userId}`);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`GET /api/onboarding/status - User not found: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if onboarding is completed
      const completed = user.onboardingCompleted === true;
      
      console.log(`GET /api/onboarding/status - User: ${userId}, Onboarding completed: ${completed}`);
      
      // Only set headers if they haven't been sent yet
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      res.json({ completed });
    } catch (error) {
      console.error("Error getting onboarding status:", error);
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ error: "Server error" });
      }
    }
  });

  // Mark onboarding as complete
  app.post("/api/onboarding/complete", async (req, res) => {
    console.log("POST /api/onboarding/complete - Request received");
    
    try {
      if (!req.isAuthenticated()) {
        console.log("POST /api/onboarding/complete - Not authenticated");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = req.user.id;
      console.log(`POST /api/onboarding/complete - Marking complete for user: ${userId}`);
      
      // Update the user's onboarding status
      const updatedUser = await storage.updateUser(userId, {
        onboardingCompleted: true
      });
      
      if (!updatedUser) {
        console.log(`POST /api/onboarding/complete - Failed to update user: ${userId}`);
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      console.log(`POST /api/onboarding/complete - Successfully completed for user: ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
}