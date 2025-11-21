"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Stepper } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  SkipForward,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "skipped"
  | "error";

export interface FormStep {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  required?: boolean;
  category?: "required" | "optional" | "review";
}

interface SteppedFormModalProps {
  // Modal props
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;

  // Steps configuration
  steps: FormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;

  // Step content rendering
  renderStep: (step: FormStep, stepIndex: number) => ReactNode;

  // Validation
  validateStep?: (stepIndex: number) => boolean | Promise<boolean>;

  // Navigation callbacks
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  onSubmit?: () => void | Promise<void>;
  onSkipOptional?: () => void;

  // State
  isSubmitting?: boolean;
  stepStatuses?: Record<string, StepStatus>;

  // UI customization
  showProgress?: boolean;
  showStepIndicators?: boolean;
  showSkipButton?: boolean;
  allowStepClick?: boolean;
  enableKeyboardNav?: boolean;
  enableTouchGestures?: boolean;
  showStatusBadge?: boolean;

  // Submit button customization
  submitButtonText?: string;
  submitButtonIcon?: LucideIcon;
  nextButtonText?: string;

  // Size
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;

  // Mode
  mode?: "dialog" | "sheet";
}

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[90vw]",
};

export function SteppedFormModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  steps,
  currentStep,
  onStepChange,
  renderStep,
  validateStep,
  onNext,
  onBack,
  onSubmit,
  onSkipOptional,
  isSubmitting = false,
  stepStatuses = {},
  showProgress = true,
  showStepIndicators = true,
  showSkipButton = true,
  allowStepClick = true,
  enableKeyboardNav = true,
  enableTouchGestures = true,
  showStatusBadge = false,
  submitButtonText = "Submit",
  submitButtonIcon: SubmitIcon = Check,
  nextButtonText = "Continue",
  size = "md",
  className,
  mode = "dialog",
}: SteppedFormModalProps) {
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const isOptionalStep =
    currentStepData?.category === "optional" &&
    currentStepData?.id !== "zone-location";

  // Calculate progress
  const completedSteps = Object.entries(stepStatuses).filter(
    ([_, status]) => status === "completed" || status === "skipped"
  ).length;
  const progress = (completedSteps / totalSteps) * 100;

  // Get step status for current step
  const currentStatus = stepStatuses[currentStep.toString()] || "active";

  // Navigation handlers (defined early to be used by touch/keyboard handlers)
  const handleNext = useCallback(async () => {
    if (isValidating) return;

    // Validate current step
    if (validateStep) {
      setIsValidating(true);
      const isValid = await validateStep(currentStep);
      setIsValidating(false);

      if (!isValid) return;
    }

    if (onNext) {
      await onNext();
    } else if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  }, [
    isValidating,
    validateStep,
    currentStep,
    totalSteps,
    onNext,
    onStepChange,
  ]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  }, [onBack, currentStep, onStepChange]);

  const handleSubmit = useCallback(async () => {
    if (onSubmit) {
      await onSubmit();
    }
  }, [onSubmit]);

  // Touch gesture handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableTouchGestures) return;
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableTouchGestures) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = async () => {
    if (!enableTouchGestures || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && !isFirstStep) {
      handleBack();
    }
    if (isLeftSwipe && !isLastStep) {
      await handleNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav || !open) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        if (isLastStep) {
          await handleSubmit();
        } else {
          await handleNext();
        }
      }
      if (e.key === "ArrowRight" && !isLastStep) {
        await handleNext();
      }
      if (e.key === "ArrowLeft" && !isFirstStep) {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    enableKeyboardNav,
    isLastStep,
    isFirstStep,
    handleNext,
    handleBack,
    handleSubmit,
  ]);

  const handleSkip = () => {
    if (onSkipOptional) {
      onSkipOptional();
    }
  };

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (allowStepClick && stepIndex <= currentStep) {
        onStepChange(stepIndex);
      }
    },
    [allowStepClick, currentStep, onStepChange]
  );

  // Status badge component
  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success/10 text-success-foreground border-border hover:bg-success/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "skipped":
        return (
          <Badge className="bg-gray-500/10 text-gray-700 border-gray-200 hover:bg-gray-500/10">
            <SkipForward className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-info/10 text-info-foreground border-border hover:bg-info/10">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-destructive/10 text-destructive-foreground border-border hover:bg-destructive/10">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // Shared content for both Dialog and Sheet modes
  const modalContent = (
    <>
      {/* Fixed Header */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {mode === "dialog" ? (
          <DialogHeader className="px-4 sm:px-6 pt-4 pb-3">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center text-base sm:text-lg">
                {Icon && <Icon className="w-5 h-5 mr-2 shrink-0" />}
                <span className="truncate">{title}</span>
              </DialogTitle>
              {/* Compact step indicator - only show on mobile when stepper is hidden */}
              <span className="text-xs text-muted-foreground sm:hidden">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>
            {/* Optional: Only show description if provided and meaningful */}
            {description &&
              description !== `Step ${currentStep + 1} of ${totalSteps}` && (
                <DialogDescription className="text-xs sm:text-sm mt-2">
                  {description}
                </DialogDescription>
              )}
          </DialogHeader>
        ) : (
          <SheetHeader className="px-4 sm:px-6 pt-4 pb-3">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center text-base sm:text-lg">
                {Icon && <Icon className="w-5 h-5 mr-2 shrink-0" />}
                <span className="truncate">{title}</span>
              </SheetTitle>
              {/* Compact step indicator - only show on mobile when stepper is hidden */}
              <span className="text-xs text-muted-foreground sm:hidden">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>
            {/* Optional: Only show description if provided and meaningful */}
            {description &&
              description !== `Step ${currentStep + 1} of ${totalSteps}` && (
                <SheetDescription className="text-xs sm:text-sm mt-2">
                  {description}
                </SheetDescription>
              )}
          </SheetHeader>
        )}

        {/* Stepper - only show on desktop, make it more compact */}
        {showStepIndicators && (
          <div className="hidden sm:block px-4 sm:px-6 pb-3 border-b">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={allowStepClick ? handleStepClick : undefined}
            />
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0">
        <div className="max-w-2xl mx-auto">
          {renderStep(currentStepData, currentStep)}
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="shrink-0 border-t bg-background p-4 sm:p-6">
        <div className="flex flex-col gap-3">
          {/* Primary Action */}
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isValidating}
              size="lg"
              className="w-full h-12 sm:h-14 text-base font-semibold bg-green-600 hover:bg-green-700 touch-manipulation active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <SubmitIcon className="w-5 h-5 mr-2" />
                  {submitButtonText}
                </>
              )}
            </Button>
          ) : (
            <ButtonGroup className="w-full">
              <Button
                onClick={handleNext}
                disabled={isSubmitting || isValidating}
                size="lg"
                className="flex-1 h-12 sm:h-14 text-base font-semibold touch-manipulation active:scale-[0.98]"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    {nextButtonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              {isOptionalStep && showSkipButton && onSkipOptional && (
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-14 touch-manipulation active:scale-[0.98]"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              )}
            </ButtonGroup>
          )}

          {/* Secondary Actions */}
          <ButtonGroup className="w-full">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                size="lg"
                className="flex-1 h-12 touch-manipulation active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              size="lg"
              className="flex-1 h-12 touch-manipulation active:scale-[0.98]"
            >
              Cancel
            </Button>
          </ButtonGroup>

          {/* Hint - make it more prominent on mobile */}
          {(enableKeyboardNav || enableTouchGestures) && (
            <div className="text-center space-y-1">
              {enableTouchGestures && (
                <p className="text-xs text-muted-foreground sm:hidden">
                  👈 Swipe to navigate 👉
                </p>
              )}
              {enableKeyboardNav && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  💡 Use Ctrl+Enter to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (mode === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "h-[95vh] p-0 gap-0 flex flex-col",
            sizeClasses[size],
            className
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {modalContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-h-[95vh] max-w-[95vw] p-0 gap-0 flex flex-col",
          sizeClasses[size],
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        showCloseButton={false}
      >
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
