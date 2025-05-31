import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook for managing user's genre preferences
 */
export function useGenrePreferences() {
  const [genrePreferences, setGenrePreferences] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch user's genre preferences
  useEffect(() => {
    if (user?.id) {
      fetchGenrePreferences();
    }
  }, [user?.id]);
  
  const fetchGenrePreferences = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("GET", "/api/users/current/preferences/genres");
      const data = await response.json();
      setGenrePreferences(data.genreIds || []);
    } catch (err) {
      console.error("Failed to fetch genre preferences:", err);
      setError("Failed to load your genre preferences");
      toast({
        title: "Error",
        description: "Failed to load your genre preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save user's genre preferences
  const saveGenrePreferences = async (genreIds: number[]) => {
    if (!user?.id) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", `/api/users/${user.id}/preferences/genres`, {
        genreIds
      });
      
      if (response.ok) {
        setGenrePreferences(genreIds);
        toast({
          title: "Success",
          description: "Your favorite genres have been saved!",
        });
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save genre preferences");
      }
    } catch (err) {
      console.error("Failed to save genre preferences:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save your genre preferences";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    genrePreferences,
    isLoading,
    error,
    fetchGenrePreferences,
    saveGenrePreferences
  };
}
