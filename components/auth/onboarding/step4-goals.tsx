"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOBILE_CONFIG } from "./config";
import { Plus, X, Target, TrendingDown } from "lucide-react";

interface SavingsGoal {
  name: string;
  targetAmount: string;
}

interface Debt {
  name: string;
  totalAmount: string;
}

interface Step4GoalsProps {
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  onUpdateGoal: (index: number, field: string, value: string) => void;
  onAddGoal: () => void;
  onRemoveGoal: (index: number) => void;
  onUpdateDebt: (index: number, field: string, value: string) => void;
  onAddDebt: () => void;
  onRemoveDebt: (index: number) => void;
  onFinish: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function Step4Goals({
  savingsGoals,
  debts,
  onUpdateGoal,
  onAddGoal,
  onRemoveGoal,
  onUpdateDebt,
  onAddDebt,
  onRemoveDebt,
  onFinish,
  onBack,
  onSkip,
}: Step4GoalsProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold leading-tight">
              Set Your Financial Goals
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Optional: Add savings goals or debts to track
            </p>
          </div>
        </div>

        <Tabs defaultValue="savings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="savings" className={MOBILE_CONFIG.touchTarget}>
              <Target className="h-4 w-4 mr-2" />
              Savings
            </TabsTrigger>
            <TabsTrigger value="debts" className={MOBILE_CONFIG.touchTarget}>
              <TrendingDown className="h-4 w-4 mr-2" />
              Debts
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="savings"
            className={MOBILE_CONFIG.spacing.betweenInputs}
          >
            <div className="space-y-4">
              {savingsGoals.map((goal, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-dashed rounded-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Label className={MOBILE_CONFIG.text.label}>
                      Goal {index + 1}
                    </Label>
                    {savingsGoals.length > 1 && (
                      <Button
                        onClick={() => onRemoveGoal(index)}
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
                      placeholder="e.g., Emergency Fund, Vacation"
                      value={goal.name}
                      onChange={(e) =>
                        onUpdateGoal(index, "name", e.target.value)
                      }
                      className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Target amount"
                      value={goal.targetAmount}
                      onChange={(e) =>
                        onUpdateGoal(index, "targetAmount", e.target.value)
                      }
                      className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={onAddGoal}
              variant="outline"
              size="lg"
              className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full mt-4`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Goal
            </Button>
          </TabsContent>

          <TabsContent
            value="debts"
            className={MOBILE_CONFIG.spacing.betweenInputs}
          >
            <div className="space-y-4">
              {debts.map((debt, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-dashed rounded-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Label className={MOBILE_CONFIG.text.label}>
                      Debt {index + 1}
                    </Label>
                    {debts.length > 1 && (
                      <Button
                        onClick={() => onRemoveDebt(index)}
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
                      placeholder="e.g., Credit Card, Student Loan"
                      value={debt.name}
                      onChange={(e) =>
                        onUpdateDebt(index, "name", e.target.value)
                      }
                      className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Total amount"
                      value={debt.totalAmount}
                      onChange={(e) =>
                        onUpdateDebt(index, "totalAmount", e.target.value)
                      }
                      className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={onAddDebt}
              variant="outline"
              size="lg"
              className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full mt-4`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Debt
            </Button>
          </TabsContent>
        </Tabs>

        <p
          className={`${MOBILE_CONFIG.text.helper} text-muted-foreground text-center mt-4`}
        >
          You can add more details and track progress later
        </p>
      </div>

      <div className="mt-auto pt-4">
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
              onClick={onFinish}
              size="lg"
              className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} flex-1`}
            >
              Finish Setup
            </Button>
          </div>
          <Button
            onClick={onSkip}
            variant="ghost"
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
          >
            Skip & Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
