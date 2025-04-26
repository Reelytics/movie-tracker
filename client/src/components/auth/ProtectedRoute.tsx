import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProtectedRoute: Authentication state", { 
      isLoading, 
      isAuthenticated: !!user,
      currentLocation: location 
    });
  }, [user, isLoading, location]);

  // Handle navigation after render
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Not authenticated, redirecting to /auth");
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  // If loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Loading your profile...</span>
      </div>
    );
  }

  // If not authenticated, show loading until redirect happens in useEffect
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Redirecting to login...</span>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}