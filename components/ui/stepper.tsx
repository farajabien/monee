"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Simplified stepper */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepItem
              step={step}
              index={index}
              currentStep={currentStep}
              onClick={() => onStepClick?.(index)}
            />
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-muted mx-1">
                <div
                  className={cn(
                    "h-full bg-primary transition-all duration-300",
                    index < currentStep ? "w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function StepItem({
  step,
  index,
  currentStep,
  onClick,
}: {
  step: Step;
  index: number;
  currentStep: number;
  onClick: () => void;
}) {
  const isComplete = index < currentStep;
  const isCurrent = index === currentStep;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 min-w-[60px]",
        index <= currentStep
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-50"
      )}
      disabled={index > currentStep}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
          isComplete && "bg-primary border-primary text-primary-foreground",
          isCurrent && "border-primary text-primary ring-2 ring-primary/20",
          !isComplete &&
            !isCurrent &&
            "border-muted-foreground/30 text-muted-foreground"
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : index + 1}
      </div>
      <div className="text-center">
        <div
          className={cn(
            "text-[10px] font-medium leading-tight",
            isCurrent && "text-primary"
          )}
        >
          {step.title}
        </div>
      </div>
    </button>
  );
}
