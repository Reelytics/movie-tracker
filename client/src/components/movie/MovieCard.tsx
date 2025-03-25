import { Link } from "wouter";
import { Movie } from "@/lib/mockData";
import RatingCircle from "./RatingCircle";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link href={`/movie/${movie.id}`}>
        <div className="movie-card bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition duration-300">
          <div className="aspect-[2/3] relative">
            <img src={movie.poster} alt={`${movie.title} poster`} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2">
              <RatingCircle rating={movie.rating} />
            </div>
          </div>
          <div className="p-2">
            <h3 className="font-medium text-sm truncate">{movie.title}</h3>
            <p className="text-xs text-muted-foreground">{movie.year}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
