import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PopcornBagProps {
  count: number;
  maxCount: number;
}

export default function PopcornBag({ count, maxCount }: PopcornBagProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create popcorn pieces whenever the count increases
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Create popcorn pieces for animation
    const createPopcornPiece = () => {
      const piece = document.createElement("div");
      piece.className = "absolute w-5 h-5 bg-amber-50 rounded-full shadow-md";
      
      // Random position at the top of the bag
      const xPos = Math.random() * 80 + 10; // 10-90% width
      piece.style.left = `${xPos}%`;
      piece.style.top = "0%";
      
      // Add animation
      piece.animate(
        [
          { transform: `translateY(-20px) rotate(0deg)`, opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { transform: `translateY(${Math.random() * 40 + 80}px) rotate(${Math.random() * 360}deg)`, opacity: 1 }
        ],
        {
          duration: 1000 + Math.random() * 500,
          easing: "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
          fill: "forwards"
        }
      );
      
      container.appendChild(piece);
      
      // Remove the piece after animation completes
      setTimeout(() => {
        piece.remove();
      }, 2000);
    };
    
    // Create a few initial pieces
    for (let i = 0; i < Math.min(count, 10); i++) {
      setTimeout(() => createPopcornPiece(), i * 100);
    }
    
  }, [count]);
  
  // Calculate bag size based on count
  let bagSize = "h-40";
  if (count > maxCount * 0.33) bagSize = "h-44";
  if (count > maxCount * 0.66) bagSize = "h-48";
  if (count >= maxCount) bagSize = "h-52";
  
  const progressPercentage = Math.min((count / maxCount) * 100, 100);
  
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`relative w-32 ${bagSize} mx-auto mb-4 overflow-hidden rounded-b-3xl`}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Bag background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-amber-600"></div>
        
        {/* Popcorn container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
        >
          {/* Placeholder popcorn pieces that are always visible */}
          <div className="absolute left-[30%] top-[50%] w-5 h-5 bg-amber-50 rounded-full shadow-md"></div>
          <div className="absolute left-[45%] top-[55%] w-5 h-5 bg-amber-50 rounded-full shadow-md"></div>
          <div className="absolute left-[60%] top-[60%] w-5 h-5 bg-amber-50 rounded-full shadow-md"></div>
          <div className="absolute left-[40%] top-[65%] w-5 h-5 bg-amber-50 rounded-full shadow-md"></div>
          <div className="absolute left-[65%] top-[70%] w-5 h-5 bg-amber-50 rounded-full shadow-md"></div>
        </div>
        
        {/* Count display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-2xl">{count}</span>
        </div>
      </motion.div>
      
      <div className="w-full">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress to next level</span>
          <span>{count}/{maxCount}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {count >= maxCount 
            ? 'You reached the maximum level!'
            : `Watch ${maxCount - count} more movies to reach the next level`}
        </p>
      </div>
    </div>
  );
}
