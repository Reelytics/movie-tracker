import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface RatingSliderProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
}

export default function RatingSlider({ 
  value, 
  onChange, 
  readOnly = false,
  className
}: RatingSliderProps) {
  // Store internal value on a 1-10 scale with one decimal place
  const [internalValue, setInternalValue] = useState<number>(value);
  
  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    if (readOnly) return;
    
    const rating = parseFloat(newValue[0].toFixed(1));
    setInternalValue(rating);
    onChange?.(rating);
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">1</div>
        <div className={cn(
          "text-2xl font-bold text-center",
          internalValue >= 7 ? "text-green-600" : 
          internalValue >= 4 ? "text-amber-500" : 
          "text-red-500"
        )}>
          {internalValue.toFixed(1)}
        </div>
        <div className="text-sm text-gray-500">10</div>
      </div>
      <Slider
        disabled={readOnly}
        value={[internalValue]}
        min={1}
        max={10}
        step={0.1}
        onValueChange={handleSliderChange}
        className={cn(
          internalValue >= 7 ? "bg-green-100" : 
          internalValue >= 4 ? "bg-amber-100" : 
          "bg-red-100",
          "h-4 rounded-md"
        )}
      />
    </div>
  );
}