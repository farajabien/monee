"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";

interface SavingsProgressCardProps {
  monthlySavings: number;
  totalSaved: number;
  totalTarget: number;
  goalsCount: number;
  isLoading?: boolean;
  userCurrency?: string;
  userLocale?: string;
}

export function SavingsProgressCard({
  monthlySavings,
  totalSaved,
  totalTarget,
  goalsCount,
  isLoading = false,
  userCurrency,
  userLocale,
}: SavingsProgressCardProps) {
  const { formatCurrency } = useCurrency(userCurrency, userLocale);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };

  const progressPercentage =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  if (isLoading) {
    return (
      <Item variant="outline" className="h-full border-0">
        <ItemHeader className="sr-only">
          <ItemTitle>
            <Wallet className="h-4 w-4" />
            Savings Progress
          </ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="animate-pulse space-y-3 w-full">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </ItemContent>
      </Item>
    );
  }

  // No savings goals case
  if (goalsCount === 0) {
    return (
      <Item variant="muted" className="h-full border-0">
        <ItemContent>
          <div className="text-center py-4 w-full">
            <p className="text-sm text-muted-foreground">
              No savings goals yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start saving for your dreams!
            </p>
            <Link href="/dashboard?tab=savings" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full border-0">
                Create Savings Goal
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        </ItemContent>
      </Item>
    );
  }

  // Determine item styling based on progress
  const itemClass =
    progressPercentage >= 75
      ? "border-0 bg-green-50/50 dark:bg-green-950/20"
      : progressPercentage >= 50
      ? "border-0 bg-blue-50/50 dark:bg-blue-950/20"
      : "border-0 bg-yellow-50/50 dark:bg-yellow-950/20";

  const progressColorClass =
    progressPercentage >= 75
      ? "text-green-600 dark:text-green-400"
      : progressPercentage >= 50
      ? "text-blue-600 dark:text-blue-400"
      : "text-yellow-600 dark:text-yellow-400";

  const remaining = totalTarget - totalSaved;

  return (
    <Item variant="outline" className={`h-full ${itemClass}`}>
      <ItemContent className="space-y-4 w-full">
        {/* Monthly Savings */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Saved This Month</div>
          <div className={`text-3xl font-bold ${progressColorClass}`}>
            {formatAmount(monthlySavings)}
          </div>
        </div>

        {/* Total Saved vs Target */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              Total Saved
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatAmount(totalSaved)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              Target
            </div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatAmount(totalTarget)}
            </div>
          </div>
        </div>

        {/* Progress Percentage */}
        <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className={`text-2xl font-bold ${progressColorClass}`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {goalsCount} active goal{goalsCount !== 1 ? "s" : ""}
            </span>
            <span>{formatAmount(remaining)} to go</span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Status Message */}
        <div className="space-y-2 pt-2">
          <div className="text-sm font-medium">
            {progressPercentage >= 100
              ? "🎉 Goals achieved! Time to celebrate!"
              : progressPercentage >= 75
              ? "💪 Almost there! Keep it up!"
              : progressPercentage >= 50
              ? "📈 Great progress! You're halfway there!"
              : progressPercentage >= 25
              ? "🌱 Good start! Keep saving consistently!"
              : "🎯 Start strong! Every bit counts!"}
          </div>
          <div className={`text-xs ${progressColorClass}`}>
            {progressPercentage >= 100
              ? "Consider setting new savings goals!"
              : remaining > 0
              ? `${formatAmount(remaining)} remaining to reach your goals`
              : "You're on track!"}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/dashboard?tab=savings" className="block">
          <Button variant="outline" size="sm" className="w-full border-0">
            Add to Savings
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </ItemContent>
    </Item>
  );
}
