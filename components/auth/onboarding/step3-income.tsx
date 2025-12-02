"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOBILE_CONFIG } from "./config";
import { Plus, X, DollarSign } from "lucide-react";

interface IncomeSource {
  name: string;
  amount: string;
}

interface Step3IncomeProps {
  incomeSources: IncomeSource[];
  onUpdateSource: (index: number, field: string, value: string) => void;
  onAddSource: () => void;
  onRemoveSource: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function Step3Income({
  incomeSources,
  onUpdateSource,
  onAddSource,
  onRemoveSource,
  onNext,
  onBack,
  onSkip,
}: Step3IncomeProps) {
  return (
    <div className={MOBILE_CONFIG.spacing.sectionGap}>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <CardTitle className={MOBILE_CONFIG.text.title}>
                Add Income Sources
              </CardTitle>
              <p className={`${MOBILE_CONFIG.text.subtitle} text-muted-foreground mt-1`}>
                Optional: Track where your money comes from
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className={MOBILE_CONFIG.spacing.betweenInputs}>
          {/* Income source list */}
          <div className="space-y-4">
            {incomeSources.map((source, index) => (
              <div
                key={index}
                className="p-4 border-2 border-dashed rounded-lg space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Label className={MOBILE_CONFIG.text.label}>
                    Income Source {index + 1}
                  </Label>
                  {incomeSources.length > 1 && (
                    <Button
                      onClick={() => onRemoveSource(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="e.g., Salary, Freelance"
                    value={source.name}
                    onChange={(e) => onUpdateSource(index, "name", e.target.value)}
                    className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monthly amount"
                    value={source.amount}
                    onChange={(e) => onUpdateSource(index, "amount", e.target.value)}
                    className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          <Button
            onClick={onAddSource}
            variant="outline"
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Another Income Source
          </Button>

          <p className={`${MOBILE_CONFIG.text.helper} text-muted-foreground text-center`}>
            You can add more details later in settings
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} flex-1`}
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} flex-1`}
          >
            Continue
          </Button>
        </div>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
