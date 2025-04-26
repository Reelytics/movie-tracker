import { 
  createContext, 
  useContext, 
  useState, 
  ReactNode
} from "react";
import { WatchedMovieWithDetails } from "@shared/schema";
import MovieDetailModal from "@/components/movies/MovieDetailModal";

interface MovieDetailModalContextType {
  openModal: (movie: WatchedMovieWithDetails) => void;
  closeModal: () => void;
}

const MovieDetailModalContext = createContext<MovieDetailModalContextType | undefined>(undefined);

export const MovieDetailModalProvider = ({ children }: { children: ReactNode }) => {
  const [selectedMovie, setSelectedMovie] = useState<WatchedMovieWithDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (movie: WatchedMovieWithDetails) => {
    setSelectedMovie(movie);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Don't clear immediately to prevent layout shift during animation
    setTimeout(() => setSelectedMovie(null), 300);
  };

  return (
    <MovieDetailModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {selectedMovie && (
        <MovieDetailModal
          watchedMovie={selectedMovie}
          isOpen={isOpen}
          onClose={closeModal}
        />
      )}
    </MovieDetailModalContext.Provider>
  );
};

export const useMovieDetailModal = () => {
  const context = useContext(MovieDetailModalContext);
  if (context === undefined) {
    throw new Error("useMovieDetailModal must be used within a MovieDetailModalProvider");
  }
  return context;
};