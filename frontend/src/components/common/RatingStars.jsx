import React from "react";
import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

export function RatingStars({ rating = 0, count, size = "sm", className = "" }) {
  const sizeMap = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSize = sizeMap[size] || sizeMap.sm;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              iconSize,
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-800">
        {rating ? rating.toFixed(1) : "N/A"}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-500 font-normal">
          ({count} avis)
        </span>
      )}
    </div>
  );
}

