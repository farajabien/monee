"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";
import { MessageSquare, Sparkles } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = db.useAuth();
  const [name, setName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [featureRequest, setFeatureRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query user's profile to get profile ID and email
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id },
      },
    },
    $users: {
      $: {
        where: { id: user?.id },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const userEmail = data?.$users?.[0]?.email;

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please provide your feedback");
      return;
    }

    if (rating === 0) {
      toast.error("Please rate your experience");
      return;
    }

    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackId = id();

      await db.transact([
        db.tx.feedback[feedbackId].update({
          name: name.trim() || undefined,
          feedbackText: feedbackText.trim(),
          rating,
          featureRequest: featureRequest.trim() || undefined,
          userEmail: userEmail || undefined,
          createdAt: Date.now(),
        }),
        db.tx.feedback[feedbackId].link({ user: profile.id }),
      ]);

      toast.success("Thank you for your feedback!", {
        description: "Your insights help us make MONEE better.",
      });

      // Reset form
      setName("");
      setFeedbackText("");
      setRating(0);
      setFeatureRequest("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Your feedback shapes the app. Share your thoughts here, or update it
            anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>App Experience Rating *</Label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <span className="text-sm text-muted-foreground">
                  {rating} / 5
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback *</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think about MONEE..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Feature Request (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="featureRequest" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Feature Requests{" "}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="featureRequest"
              placeholder="Any features you'd like to see?"
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
