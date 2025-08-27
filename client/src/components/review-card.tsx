import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import StarRating from "./star-rating";
import type { ReviewWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  review: ReviewWithUser;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <Card className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Reviewer Avatar */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.reviewer.profileImageUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-mint to-powder text-white text-sm font-medium">
              {getInitials(review.reviewer.firstName, review.reviewer.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-charcoal dark:text-foreground">
                  {review.isAnonymous 
                    ? "Anonymous User" 
                    : `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'User'
                  }
                </h4>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt!))} ago
                </p>
              </div>
              <StarRating rating={review.rating} size="small" />
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">
                "{review.comment}"
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}