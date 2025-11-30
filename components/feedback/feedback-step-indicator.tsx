import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress Bar (Mobile) */}
      <div className="md:hidden mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-primary">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Dots (Desktop) */}
      <div className="hidden md:flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                    isCompleted &&
                      "bg-primary text-primary-foreground shadow-sm",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                {stepLabels && stepLabels[step - 1] && (
                  <span
                    className={cn(
                      "text-xs mt-1.5 whitespace-nowrap",
                      (isCurrent || isCompleted)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {stepLabels[step - 1]}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2 transition-all duration-200",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
