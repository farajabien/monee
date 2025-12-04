"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, DollarSign } from "lucide-react";

interface IncomeSource {
  name: string;
  amount: string;
  frequency: string;
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6 space-y-6">
      <div className="space-y-4">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl font-semibold leading-tight">
                Add Income Sources
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Optional: Track where your money comes from
              </p>
            </div>
          </div>
        </CardHeader>
        {/* Income source list */}
        <div className="space-y-4">
          {incomeSources.map((source, index) => (
            <div
              key={index}
              className="p-4 border-2 border-dashed rounded-lg space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Label className="text-sm font-medium">
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
                  onChange={(e) =>
                    onUpdateSource(index, "name", e.target.value)
                  }
                  className="h-12 text-base"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={source.amount}
                  onChange={(e) =>
                    onUpdateSource(index, "amount", e.target.value)
                  }
                  className="h-12 text-base"
                />
                <div className="space-y-2">
                  <Label
                    htmlFor={`frequency-${index}`}
                    className="text-sm font-medium"
                  >
                    Frequency
                  </Label>
                  <Select
                    value={source.frequency}
                    onValueChange={(value) =>
                      onUpdateSource(index, "frequency", value)
                    }
                  >
                    <SelectTrigger
                      id={`frequency-${index}`}
                      className="h-12 text-base w-full"
                    >
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="weekly"
                        className="h-12 text-base cursor-pointer"
                      >
                        Weekly
                      </SelectItem>
                      <SelectItem
                        value="biweekly"
                        className="h-12 text-base cursor-pointer"
                      >
                        Bi-weekly
                      </SelectItem>
                      <SelectItem
                        value="monthly"
                        className="h-12 text-base cursor-pointer"
                      >
                        Monthly
                      </SelectItem>
                      <SelectItem
                        value="quarterly"
                        className="h-12 text-base cursor-pointer"
                      >
                        Quarterly
                      </SelectItem>
                      <SelectItem
                        value="annually"
                        className="h-12 text-base cursor-pointer"
                      >
                        Annually
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add more button */}
        <Button
          onClick={onAddSource}
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Another Income Source
        </Button>

        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
          You can add more details later in settings
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-auto pt-4 space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1 h-12 text-base font-medium shadow-sm"
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            className="flex-1 h-12 text-base font-medium shadow-sm"
          >
            Continue
          </Button>
        </div>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
