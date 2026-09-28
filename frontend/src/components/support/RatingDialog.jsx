import React, { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

export default function RatingDialog({
  open,
  onClose,
  onSubmitRating,
  ticket,
  isRating = false,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    await onSubmitRating(rating, comment.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader className="pb-3 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Support Satisfaction Rating
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            How satisfied were you with the resolution of ticket <strong className="font-mono text-zinc-800">{ticket?.ticketNumber}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 text-xs text-center">
          {/* Interactive Stars */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoverRating ? star <= hoverRating : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-300 hover:text-amber-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-zinc-700">
            {rating === 5 && "⭐ Excellent Support"}
            {rating === 4 && "👍 Very Good"}
            {rating === 3 && "👌 Acceptable"}
            {rating === 2 && "👎 Below Expectations"}
            {rating === 1 && "❌ Poor Experience"}
          </p>

          <div className="text-left space-y-1.5">
            <label className="font-semibold text-zinc-700 block">
              Additional Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what went well or how we can improve support..."
              className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 resize-none transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRating}
            className="h-8 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 gap-1.5"
          >
            {isRating ? (
              <Spinner className="size-3.5 text-white" />
            ) : (
              <span>Submit Rating</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
