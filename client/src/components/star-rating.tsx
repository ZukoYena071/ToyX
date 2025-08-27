import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "medium", 
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6"
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= rating;
        const isHalfFilled = rating > index && rating < starNumber;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starNumber)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled 
                  ? "text-yellow-400 fill-yellow-400" 
                  : isHalfFilled
                  ? "text-yellow-400 fill-yellow-400/50"
                  : "text-gray-300 dark:text-gray-600"
              } transition-colors`}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600 dark:text-muted-foreground font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}