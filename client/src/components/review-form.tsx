import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StarRating from "./star-rating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertReview } from "@shared/schema";
import { X } from "lucide-react";

interface ReviewFormProps {
  exchangeId: number;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
}

export default function ReviewForm({ exchangeId, revieweeId, revieweeName, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: Omit<InsertReview, "reviewerId">) => {
      return await apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      // Invalidate all relevant queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/users", revieweeId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", revieweeId, "rating"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "can-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      exchangeId,
      revieweeId,
      rating,
      comment: comment.trim() || undefined,
      isAnonymous,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-card rounded-3xl shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-charcoal dark:text-foreground">
              Review {revieweeName}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            How was your experience with this toy exchange?
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <Label className="block text-sm font-medium text-charcoal dark:text-foreground mb-3">
                Rating *
              </Label>
              <StarRating
                rating={rating}
                size="large"
                interactive
                onRatingChange={setRating}
              />
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment" className="block text-sm font-medium text-charcoal dark:text-foreground mb-2">
                Comment (Optional)
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this exchange..."
                className="rounded-2xl border-gray-200 dark:border-border focus:ring-mint focus:border-mint"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Anonymous option */}
            <div className="flex items-center space-x-3">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="text-sm text-charcoal dark:text-foreground">
                Submit anonymously
              </Label>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rating === 0 || createReviewMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}