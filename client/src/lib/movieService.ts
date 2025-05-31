import { WatchedMovieWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Service functions for movie operations
export const movieService = {
  /**
   * Remove a watched movie from the user's watch list
   * @param id The ID of the watched movie to remove
   * @returns Promise that resolves when the movie is successfully removed
   */
  async removeMovie(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/movies/watched/${id}`);
  },
  
  /**
   * Toggle the favorite status of a watched movie
   * @param id The ID of the watched movie
   * @param isFavorite The new favorite status
   * @returns The updated watched movie
   */
  async toggleFavorite(id: number, isFavorite: boolean): Promise<WatchedMovieWithDetails> {
    return await apiRequest("PATCH", `/api/movies/watched/${id}`, {
      favorite: isFavorite
    });
  }
};
