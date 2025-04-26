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
  const { data: user, error, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    // If 401, don't throw error, just return null
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    initialData: null, // Initialize with null to avoid undefined
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Logging in user:", credentials.username);
      const response = await apiRequest("POST", "/api/login", credentials);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid username or password");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      toast({
        title: "Logged in",
        description: `Welcome back, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
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
      const response = await apiRequest("POST", "/api/register", credentials);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      toast({
        title: "Registered",
        description: `Welcome, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
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