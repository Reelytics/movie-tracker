import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function Rating({ 
  value, 
  onChange, 
  readOnly = false,
  size = "md" 
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const maxStars = 5;
  
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  // Get size class based on size prop
  const sizeClass = useMemo(() => {
    switch (size) {
      case "xs": return "w-3 h-3";
      case "sm": return "w-4 h-4";
      case "lg": return "w-7 h-7";
      default: return "w-5 h-5";
    }
  }, [size]);
  
  const handleClick = (starValue: number) => {
    if (readOnly) return;
    onChange?.(starValue);
  };
  
  const handleMouseEnter = (starValue: number) => {
    if (readOnly) return;
    setHoverValue(starValue);
  };
  
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
  };
  
  return (
    <div className="inline-flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= displayValue;
        const halfFilled = !filled && starValue - 0.5 <= displayValue;
        
        return (
          <span 
            key={index}
            className={cn(
              "cursor-pointer text-amber-400",
              readOnly ? "cursor-default" : "cursor-pointer",
              !filled && !halfFilled && "text-gray-300",
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          >
            <Star 
              className={cn(sizeClass, "mx-0.5")}
              fill={filled ? "currentColor" : "none"}
            />
          </span>
        );
      })}
    </div>
  );
}
