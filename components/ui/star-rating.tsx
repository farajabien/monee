"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 24,
  readonly = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const isActive = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            disabled={readonly}
            className={cn(
              "transition-all duration-150",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
            aria-label={`Rate ${star} out of ${max}`}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isActive
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "fill-none stroke-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
