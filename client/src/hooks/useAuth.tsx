import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicture: string | null;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterCredentials = {
  username: string;
  password: string;
  email: string;
  fullName?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUserCache: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get current user from localStorage first, then try API if needed
  const [localUser, setLocalUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error reading user from localStorage', e);
      return null;
    }
  });
  
  // Get current user from API as backup
  const { data: apiUser, error, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    // If 401, don't throw error, just return null
    staleTime: 1000 * 60, // 1 minute (shorter to ensure we detect session changes)
    gcTime: 1000 * 60 * 10, // 10 minutes
    initialData: null, // Initialize with null to avoid undefined
    enabled: !localUser, // Only run if no local user
    queryFn: async () => {
      try {
        console.log("Fetching current user data from API...");
        const response = await fetch('/api/user', { 
          credentials: 'include', // Important: This ensures cookies are sent
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.status === 401) {
          console.log("User not authenticated via API");
          return null;
        }
        
        if (!response.ok) {
          console.error("Error response from API:", response.status);
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        console.log("User data retrieved from API:", userData);
        
        // Save to localStorage
        localStorage.setItem('reelytics_user', JSON.stringify(userData));
        
        return userData;
      } catch (error) {
        console.error('Error fetching user from API:', error);
        return null;
      }
    }
  });
  
  // Use local user if available, otherwise use API user
  const user = localUser || apiUser;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Logging in user:", credentials.username);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // Prevent caching
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache"
        },
        body: JSON.stringify(credentials),
        credentials: "include" // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid username or password");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful, user data:", data);
      
      // Save to localStorage
      localStorage.setItem('reelytics_user', JSON.stringify(data));
      setLocalUser(data);
      
      // Set user data in cache
      queryClient.setQueryData(['/api/user'], data);
      
      // Use wouter for navigation
      setLocation('/');
      
      toast({
        title: "Logged in",
        description: `Welcome back, ${data.username}!`,
      });
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
      // Additional error handling will be done at the form level
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear localStorage
      localStorage.removeItem('reelytics_user');
      setLocalUser(null);
      
      // Update query cache
      queryClient.setQueryData(['/api/user'], null);
      
      // Use wouter for navigation
      setLocation('/auth');
      
      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log("Registering user:", credentials.username);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // Prevent caching
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache"
        },
        body: JSON.stringify(credentials),
        credentials: "include" // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Registration successful, user data:", data);
      
      // Save to localStorage
      localStorage.setItem('reelytics_user', JSON.stringify(data));
      setLocalUser(data);
      
      // Set user data in cache
      queryClient.setQueryData(['/api/user'], data);
      
      // Use wouter for navigation
      setLocation('/');
      
      toast({
        title: "Account created",
        description: `Welcome to Reelytics, ${data.username}!`,
      });
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
      // Additional error handling will be done at the form level
    },
  });

  // Login function
  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    await registerMutation.mutateAsync(credentials);
  };

  // Update user cache function - synchronizes user data across components
  const updateUserCache = (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      // Create updated user object
      const updatedUser = { ...user, ...userData };
      
      // Update localStorage
      localStorage.setItem('reelytics_user', JSON.stringify(updatedUser));
      
      // Update local state
      setLocalUser(updatedUser);
      
      // Update query cache for both API paths
      queryClient.setQueryData(['/api/user'], updatedUser);
      
      // Also update the current user profile cache
      queryClient.setQueryData(['/api/users/current'], {
        user: updatedUser,
        stats: queryClient.getQueryData(['/api/users/current'])?.stats || {}
      });
      
      console.log("User cache updated:", updatedUser);
    } catch (error) {
      console.error("Error updating user cache:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
        updateUserCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}