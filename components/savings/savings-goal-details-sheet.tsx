"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Repeat,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { SavingsGoal } from "@/types";

interface SavingsGoalWithContributions extends SavingsGoal {
  contributions?: Array<{
    id: string;
    amount: number;
    date: number;
    contributionDate: number;
    notes?: string;
    createdAt: number;
  }>;
}

interface SavingsGoalDetailsSheetProps {
  savingsGoal: SavingsGoalWithContributions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavingsGoalDetailsSheet({
  savingsGoal,
  open,
  onOpenChange,
}: SavingsGoalDetailsSheetProps) {
  const { formatCurrency } = useCurrency();

  const calculations = useMemo(() => {
    if (!savingsGoal) return null;

    const totalContributed =
      savingsGoal.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const remaining = savingsGoal.targetAmount - savingsGoal.currentAmount;
    const progress =
      (savingsGoal.currentAmount / savingsGoal.targetAmount) * 100;
    const avgContribution =
      savingsGoal.contributions && savingsGoal.contributions.length > 0
        ? totalContributed / savingsGoal.contributions.length
        : 0;

    // Estimate completion date based on average contribution
    let estimatedCompletion = null;
    if (avgContribution > 0 && remaining > 0) {
      const contributionsNeeded = Math.ceil(remaining / avgContribution);
      const daysPerContribution = savingsGoal.isRegular
        ? savingsGoal.frequency === "weekly"
          ? 7
          : savingsGoal.frequency === "biweekly"
          ? 14
          : savingsGoal.frequency === "monthly"
          ? 30
          : savingsGoal.frequency === "quarterly"
          ? 90
          : 365
        : 30; // Default to monthly if not regular

      const daysUntilCompletion = contributionsNeeded * daysPerContribution;
      estimatedCompletion = new Date(
        Date.now() + daysUntilCompletion * 24 * 60 * 60 * 1000
      );
    }

    // Days until deadline
    let daysUntilDeadline = null;
    if (savingsGoal.deadline) {
      const now = Date.now();
      const diff = savingsGoal.deadline - now;
      daysUntilDeadline = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      totalContributed,
      remaining,
      progress,
      avgContribution,
      estimatedCompletion,
      daysUntilDeadline,
    };
  }, [savingsGoal]);

  if (!savingsGoal) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annually: "Annually",
    } as const;
    return labels[frequency as keyof typeof labels] || frequency;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {savingsGoal.emoji && (
              <span className="text-2xl">{savingsGoal.emoji}</span>
            )}
            {savingsGoal.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Target</p>
              <p className="text-2xl font-bold">
                {formatCurrency(savingsGoal.targetAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(savingsGoal.currentAmount)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {calculations?.progress.toFixed(1)}%
                </span>
                {savingsGoal.isCompleted && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={calculations?.progress || 0} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {formatCurrency(calculations?.remaining || 0)} remaining
            </p>
          </div>

          {/* Goal Information */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {savingsGoal.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary">{savingsGoal.category}</Badge>
                </div>
              )}
              {savingsGoal.deadline && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline</span>
                    </div>
                    <span className="font-medium">
                      {formatDate(savingsGoal.deadline)}
                    </span>
                  </div>
                  {calculations?.daysUntilDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Time Remaining
                      </span>
                      <span
                        className={`font-medium ${
                          calculations.daysUntilDeadline < 30
                            ? "text-destructive"
                            : ""
                        }`}
                      >
                        {calculations.daysUntilDeadline} days
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Regular Savings Details */}
          {savingsGoal.isRegular && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Regular Savings</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frequency</span>
                  <span className="font-medium">
                    {getFrequencyLabel(savingsGoal.frequency || "")}
                  </span>
                </div>
                {savingsGoal.regularAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Regular Amount
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(savingsGoal.regularAmount)}
                    </span>
                  </div>
                )}
                {savingsGoal.nextDueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Next Due
                    </span>
                    <span className="font-medium">
                      {formatDate(savingsGoal.nextDueDate)}
                    </span>
                  </div>
                )}
                {savingsGoal.lastContributionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Contribution
                    </span>
                    <span className="text-sm">
                      {formatDate(savingsGoal.lastContributionDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {savingsGoal.contributions && savingsGoal.contributions.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Statistics</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Contributed
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(calculations?.totalContributed || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Contributions
                  </span>
                  <span className="font-medium">
                    {savingsGoal.contributions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Contribution
                  </span>
                  <span className="font-medium">
                    {formatCurrency(calculations?.avgContribution || 0)}
                  </span>
                </div>
                {calculations?.estimatedCompletion && !savingsGoal.isCompleted && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Est. Completion
                    </span>
                    <span className="text-sm">
                      {formatDate(calculations.estimatedCompletion.getTime())}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contribution History */}
          {savingsGoal.contributions && savingsGoal.contributions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Contribution History</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {savingsGoal.contributions
                  .sort((a, b) => b.contributionDate - a.contributionDate)
                  .map((contribution) => (
                    <Card key={contribution.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">
                            {formatCurrency(contribution.amount)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(contribution.contributionDate)}
                          </span>
                        </div>
                        {contribution.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {contribution.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!savingsGoal.contributions ||
            savingsGoal.contributions.length === 0) && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No contributions yet</p>
              </CardContent>
            </Card>
          )}

          {/* Created Date */}
          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            Created on {formatDate(savingsGoal.createdAt)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
