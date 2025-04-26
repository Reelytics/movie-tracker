import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserProfile } from "@shared/schema";

export function useUser() {
  const queryClient = useQueryClient();

  // Get current user profile
  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["/api/users/current"],
  });

  // Update user profile
  const updateProfile = useMutation({
    mutationFn: async (userData: {
      username?: string;
      fullName?: string;
      bio?: string;
      profilePicture?: string;
    }) => {
      return apiRequest("PATCH", "/api/users/current", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
