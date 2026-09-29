import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import Spinner from "@/components/ui/spinner";

export const RatingDialog = ({
  open = false,
  onOpenChange,
  ticket = {},
  onConfirm,
  isPending = false,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    await onConfirm({
      ticketId: ticket._id,
      rating,
      comment: comment.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <DialogTitle className="text-lg">How was your support experience?</DialogTitle>
          <DialogDescription className="text-xs">
            Your feedback helps us provide better and faster help for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Star Rating Selector */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      active
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs font-semibold text-foreground">
            {rating === 5 && "⭐ Excellent - Quick and helpful!"}
            {rating === 4 && "👍 Good - Problem was solved"}
            {rating === 3 && "👌 Fair - Okay experience"}
            {rating === 2 && "👎 Poor - Took too long or wasn't clear"}
            {rating === 1 && "❌ Very Poor - Issue was not resolved well"}
          </p>

          {/* Optional Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Additional comments (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what went well or what we can improve..."
              rows={3}
              className="rounded-xl text-xs"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-xl gap-1.5"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Rating</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
