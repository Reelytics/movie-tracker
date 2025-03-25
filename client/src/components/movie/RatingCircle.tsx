import { cn } from "@/lib/utils";

interface RatingCircleProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function RatingCircle({ 
  rating, 
  size = "sm",
  className 
}: RatingCircleProps) {
  // Convert rating to percentage for the conic gradient
  const percentage = (rating / 10) * 100;
  
  // Size classes
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-14 h-14 text-base"
  };
  
  return (
    <div 
      className={cn(
        "relative rounded-full flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      style={{ 
        background: `conic-gradient(hsl(var(--primary)) 0% ${percentage}%, hsl(var(--muted)) ${percentage}% 100%)`
      }}
    >
      <div className="absolute inset-[2px] rounded-full bg-background"></div>
      <span className="relative z-10 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}
