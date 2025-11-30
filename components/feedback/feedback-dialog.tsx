"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StarRating } from "@/components/ui/star-rating";
import { FeedbackTypeCard } from "./feedback-type-card";
import { StepIndicator } from "./feedback-step-indicator";
import { toast } from "sonner";
import {
  Bug,
  Sparkles,
  Lightbulb,
  Palette,
  Zap,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = "Bug" | "Feature" | "Suggestion" | "UI/UX" | "Performance" | "General";
type Priority = "Low" | "Medium" | "High";
type AffectedArea = "Expenses" | "Debts" | "Savings" | "Income" | "Dashboard" | "Settings" | "Other";

const FEEDBACK_TYPES = [
  {
    value: "Bug" as FeedbackType,
    emoji: "🐛",
    icon: Bug,
    title: "Bug/Error",
    description: "Something's broken or not working",
  },
  {
    value: "Feature" as FeedbackType,
    emoji: "✨",
    icon: Sparkles,
    title: "Feature Request",
    description: "New functionality I'd like to see",
  },
  {
    value: "Suggestion" as FeedbackType,
    emoji: "💡",
    icon: Lightbulb,
    title: "Suggestion",
    description: "Improvement to existing features",
  },
  {
    value: "UI/UX" as FeedbackType,
    emoji: "🎨",
    icon: Palette,
    title: "UI/UX Issue",
    description: "Design or usability problem",
  },
  {
    value: "Performance" as FeedbackType,
    emoji: "⚡",
    icon: Zap,
    title: "Performance",
    description: "App is slow or unresponsive",
  },
  {
    value: "General" as FeedbackType,
    emoji: "📝",
    icon: MessageSquare,
    title: "General",
    description: "Anything else",
  },
];

const AFFECTED_AREAS: AffectedArea[] = [
  "Expenses",
  "Debts",
  "Savings",
  "Income",
  "Dashboard",
  "Settings",
  "Other",
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = db.useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType | "">("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [affectedArea, setAffectedArea] = useState<AffectedArea | "">("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [name, setName] = useState("");

  // Query user's profile
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

  // Pre-fill name if available
  useEffect(() => {
    if (profile?.handle && !name) {
      setName(profile.handle);
    }
  }, [profile?.handle, name]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCurrentStep(1);
        setFeedbackType("");
        setFeedbackText("");
        setRating(0);
        setPriority("Medium");
        setAffectedArea("");
        setStepsToReproduce("");
        // Don't reset name as user might want to keep it
      }, 200);
    }
  }, [open]);

  const getTotalSteps = () => {
    if (feedbackType === "General") return 3; // Type, Details+Rating, Name
    if (feedbackType === "Bug") return 4; // Type, Details, BugInfo, Name
    return 3; // Type, Details, Name
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return feedbackType !== "";
      case 2:
        if (feedbackType === "General") {
          return feedbackText.trim() !== "" && rating > 0;
        }
        return feedbackText.trim() !== "";
      case 3:
        if (feedbackType === "Bug") {
          // Bug-specific step, always can proceed (optional fields)
          return true;
        }
        // Name step, optional
        return true;
      case 4:
        // Final name step for bugs
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!feedbackType || !feedbackText.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    if (feedbackType === "General" && rating === 0) {
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
          feedbackType,
          feedbackText: feedbackText.trim(),
          rating: feedbackType === "General" ? rating : undefined,
          priority: feedbackType === "Bug" ? priority : undefined,
          affectedArea: affectedArea || undefined,
          stepsToReproduce:
            feedbackType === "Bug" && stepsToReproduce.trim()
              ? stepsToReproduce.trim()
              : undefined,
          name: name.trim() || undefined,
          userEmail: userEmail || undefined,
          createdAt: Date.now(),
        }),
        db.tx.feedback[feedbackId].link({ user: profile.id }),
      ]);

      toast.success("Thank you for your feedback!", {
        description: "Your insights help us make MONEE better.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    // Step 1: Select Feedback Type
    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">What would you like to share?</h3>
            <p className="text-sm text-muted-foreground">
              Select the type that best describes your feedback
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEEDBACK_TYPES.map((type) => (
              <FeedbackTypeCard
                key={type.value}
                icon={type.icon}
                emoji={type.emoji}
                title={type.title}
                description={type.description}
                value={type.value}
                selected={feedbackType === type.value}
                onClick={() => setFeedbackType(type.value)}
              />
            ))}
          </div>
        </div>
      );
    }

    // Step 2: Details
    if (currentStep === 2) {
      const selectedType = FEEDBACK_TYPES.find((t) => t.value === feedbackType);

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{selectedType?.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold">{selectedType?.title}</h3>
              <p className="text-sm text-muted-foreground">Tell us more...</p>
            </div>
          </div>

          {/* For General feedback: Show rating first */}
          {feedbackType === "General" && (
            <div className="space-y-2">
              <Label>How would you rate your experience? *</Label>
              <div className="flex items-center gap-3 py-2">
                <StarRating value={rating} onChange={setRating} size={32} />
                {rating > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main feedback text */}
          <div className="space-y-2">
            <Label htmlFor="feedbackText">
              {feedbackType === "Bug" && "What happened?"}
              {feedbackType === "Feature" && "Describe your idea"}
              {feedbackType === "Suggestion" && "What would you improve?"}
              {feedbackType === "UI/UX" && "Describe the issue"}
              {feedbackType === "Performance" && "What feels slow?"}
              {feedbackType === "General" && "Share your thoughts"}
              {" *"}
            </Label>
            <Textarea
              id="feedbackText"
              placeholder={
                feedbackType === "Bug"
                  ? "Tell us what went wrong and what you expected to happen..."
                  : feedbackType === "Feature"
                  ? "Describe the feature you'd like to see..."
                  : feedbackType === "Suggestion"
                  ? "How can we make this better?"
                  : "Tell us more..."
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Affected Area for non-general feedback */}
          {feedbackType !== "General" && (
            <div className="space-y-2">
              <Label htmlFor="affectedArea">
                Which area is affected? <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Select value={affectedArea} onValueChange={(value) => setAffectedArea(value as AffectedArea)}>
                <SelectTrigger id="affectedArea" className="h-11">
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {AFFECTED_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    }

    // Step 3: Bug-specific details OR Name step
    if (currentStep === 3) {
      if (feedbackType === "Bug") {
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bug className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold">Bug Details</h3>
            </div>

            {/* Priority */}
            <div className="space-y-3">
              <Label>Priority *</Label>
              <RadioGroup value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <div className="grid grid-cols-3 gap-2">
                  <Label
                    htmlFor="low"
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                      priority === "Low"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value="Low" id="low" className="sr-only" />
                    <span className="text-sm font-medium">Low</span>
                  </Label>
                  <Label
                    htmlFor="medium"
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                      priority === "Medium"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value="Medium" id="medium" className="sr-only" />
                    <span className="text-sm font-medium">Medium</span>
                  </Label>
                  <Label
                    htmlFor="high"
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                      priority === "High"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value="High" id="high" className="sr-only" />
                    <span className="text-sm font-medium">High</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Steps to reproduce */}
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">
                Steps to reproduce <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="stepsToReproduce"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Notice..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
              />
            </div>
          </div>
        );
      }

      // Name step for non-bug feedback
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Check className="h-12 w-12 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Almost done!</h3>
            <p className="text-sm text-muted-foreground">
              Help us get back to you (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              We'll only use this to follow up on your feedback
            </p>
          </div>
        </div>
      );
    }

    // Step 4: Name step for bugs
    if (currentStep === 4 && feedbackType === "Bug") {
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Check className="h-12 w-12 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Almost done!</h3>
            <p className="text-sm text-muted-foreground">
              Help us get back to you (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              We'll only use this to follow up on your feedback
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const isLastStep = currentStep === getTotalSteps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Your feedback shapes the app. Help us make MONEE better.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={getTotalSteps()}
          stepLabels={
            feedbackType === "Bug"
              ? ["Type", "Details", "Bug Info", "Name"]
              : feedbackType === "General"
              ? ["Type", "Rate & Share", "Name"]
              : ["Type", "Details", "Name"]
          }
        />

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep === 1 && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
