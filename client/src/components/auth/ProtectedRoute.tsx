import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);

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

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ProtectedRoute: Authentication state", { 
      isLoading, 
      isAuthenticated: !!(user || localUser),
      localUser: !!localUser,
      currentLocation: location 
    });
  }, [user, localUser, isLoading, location]);

  // Handle navigation after render
  useEffect(() => {
    if (!isLoading && !user && checkedLocalStorage && !localUser) {
      console.log("Not authenticated, redirecting to /auth");
      setLocation("/auth");
    }
  }, [user, localUser, isLoading, checkedLocalStorage, setLocation]);

  // If loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Loading your profile...</span>
      </div>
    );
  }

  // If not authenticated but we have a local user, use that
  if (!user && localUser) {
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

  // If authenticated, render children
  return <>{children}</>;
}