import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) {
        setLocalUser(JSON.parse(savedUser));
      }
      setCheckedLocalStorage(true);
    } catch (e) {
      console.error('Error reading user from localStorage', e);
      setCheckedLocalStorage(true);
    }
  }, []);

  // Check if user needs onboarding when authenticated
  useEffect(() => {
    const currentUser = user || localUser;
    
    if (currentUser && !isLoading && !checkingOnboarding) {
      // Prevent re-running this effect while already checking
      setCheckingOnboarding(true);
      
      // First check localStorage for quick response
      const onboardingCompleted = localStorage.getItem("onboardingComplete") === "true";
      
      if (onboardingCompleted) {
        setCheckingOnboarding(false);
        setNeedsOnboarding(false);
        return;
      }
      
      // Use a flag to track API request attempts
      let apiRequestAttempted = false;
      
      // Then verify with the server
      const checkOnboardingStatus = async () => {
        // Prevent duplicate API requests
        if (apiRequestAttempted) return;
        apiRequestAttempted = true;
        
        try {
          console.log("Checking onboarding status with server...");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await apiRequest("GET", "/api/onboarding/status", null, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          clearTimeout(timeoutId);
          console.log("Onboarding status response:", response);
          
          const completed = response?.completed === true;
          
          if (completed) {
            // Update localStorage if server says it's complete
            localStorage.setItem("onboardingComplete", "true");
            setNeedsOnboarding(false);
          } else {
            // User needs onboarding
            setNeedsOnboarding(true);
            
            // Only redirect if not already on the onboarding page
            if (location !== "/onboarding") {
              setLocation("/onboarding");
            }
          }
        } catch (error) {
          console.error("Failed to check onboarding status:", error);
          // Default to localStorage value if server check fails
          // But don't keep redirecting if there's an issue with the API
          if (!onboardingCompleted && location !== "/onboarding") {
            setNeedsOnboarding(true);
            setLocation("/onboarding");
          } else {
            setNeedsOnboarding(false);
          }
        } finally {
          setCheckingOnboarding(false);
        }
      };
      
      checkOnboardingStatus();
    }
  }, [user, localUser, isLoading, location, setLocation]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProtectedRoute: Authentication state", { 
      isLoading, 
      isAuthenticated: !!(user || localUser),
      localUser: !!localUser,
      needsOnboarding,
      checkingOnboarding,
      currentLocation: location 
    });
  }, [user, localUser, isLoading, location, needsOnboarding, checkingOnboarding]);

  // Handle navigation after render for unauthenticated users
  useEffect(() => {
    if (!isLoading && !user && checkedLocalStorage && !localUser) {
      console.log("Not authenticated, redirecting to /auth");
      setLocation("/auth");
    }
  }, [user, localUser, isLoading, checkedLocalStorage, setLocation]);

  // If loading, show a loading spinner
  if (isLoading || checkingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">
          {isLoading ? "Loading your profile..." : "Checking onboarding status..."}
        </span>
      </div>
    );
  }

  // If not authenticated but we have a local user, check onboarding
  if (!user && localUser) {
    if (needsOnboarding && location !== "/onboarding") {
      // If we're not on the onboarding page, redirect there
      setLocation("/onboarding");
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-primary">Redirecting to onboarding...</span>
        </div>
      );
    }
    return <>{children}</>;
  }
  
  // If not authenticated at all, show loading until redirect happens in useEffect
  if (!user && !localUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Redirecting to login...</span>
      </div>
    );
  }

  // If authenticated but needs onboarding and not already on the onboarding page
  if (needsOnboarding && location !== "/onboarding") {
    setLocation("/onboarding");
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Redirecting to onboarding...</span>
      </div>
    );
  }

  // If authenticated and onboarding is complete (or on onboarding page), render children
  return <>{children}</>;
}