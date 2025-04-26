import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: user, error, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    // If 401, don't throw error, just return null
    staleTime: 1000 * 60, // 1 minute (shorter to ensure we detect session changes)
    gcTime: 1000 * 60 * 10, // 10 minutes
    initialData: null, // Initialize with null to avoid undefined
    queryFn: async () => {
      try {
        console.log("Fetching current user data...");
        const response = await fetch('/api/user', { 
          credentials: 'include', // Important: This ensures cookies are sent
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          mode: 'cors' // Explicitly set CORS mode
        });
        
        console.log("User API response status:", response.status);
        // Convert headers to object to avoid TypeScript iterator issues
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("User API response headers:", headers);
        
        if (response.status === 401) {
          console.log("User not authenticated");
          return null;
        }
        
        if (!response.ok) {
          console.error("Error response from API:", response.status);
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        console.log("User data retrieved:", userData);
        return userData;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    }
  });

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
      
      // Set user data in cache
      queryClient.setQueryData(['/api/user'], data);
      
      // Add a small delay to ensure state updates before redirection
      setTimeout(() => {
        // Force refetch all queries to ensure data is fresh
        queryClient.invalidateQueries();
        
        toast({
          title: "Logged in",
          description: `Welcome back, ${data.username}!`,
        });
      }, 100);
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
      queryClient.setQueryData(['/api/user'], null);
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
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
      
      // Set user data in cache
      queryClient.setQueryData(['/api/user'], data);
      
      // Add a small delay to ensure state updates before redirection
      setTimeout(() => {
        // Force refetch all queries to ensure data is fresh
        queryClient.invalidateQueries();
        
        toast({
          title: "Account created",
          description: `Welcome to Reelytics, ${data.username}!`,
        });
      }, 100);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
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