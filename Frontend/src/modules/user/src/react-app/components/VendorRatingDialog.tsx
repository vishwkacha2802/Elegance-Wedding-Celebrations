import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { Button } from "@user/react-app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@user/react-app/components/ui/dialog";
import { Label } from "@user/react-app/components/ui/label";
import { Textarea } from "@user/react-app/components/ui/textarea";

type VendorRatingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  averageRating: number;
  totalReviews: number;
  initialRating: number;
  initialReview: string;
  isSubmitting?: boolean;
  onSubmit: (payload: { rating: number; review: string }) => void | Promise<void>;
};

export default function VendorRatingDialog({
  open,
  onOpenChange,
  vendorName,
  averageRating,
  totalReviews,
  initialRating,
  initialReview,
  isSubmitting = false,
  onSubmit,
}: VendorRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setRating(initialRating || 0);
    setReview(initialReview || "");
  }, [open, initialRating, initialReview]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-rose/20 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Rate {vendorName}</DialogTitle>
          <DialogDescription>
            {totalReviews > 0
              ? `Current rating: ${averageRating.toFixed(1)} out of 5 from ${totalReviews} review${
                  totalReviews === 1 ? "" : "s"
                }.`
              : "Be the first to rate this service."} Reviews appear on user and vendor pages after admin approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Your Service Rating</Label>
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={`rating-star-${starValue}`}
                  type="button"
                  onClick={() => setRating(starValue)}
                  className="rounded-md p-1 transition hover:scale-105"
                  aria-label={`Rate ${starValue} star`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      starValue <= rating ? "fill-gold text-gold" : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-rating-review">Review</Label>
            <Textarea
              id="vendor-rating-review"
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Share a few details about your experience..."
              className="min-h-28 border-rose/20 focus-visible:ring-rose"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit({ rating, review })}
            disabled={isSubmitting || rating < 1}
            className="bg-gradient-to-r from-rose to-gold text-white hover:opacity-90"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
