"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";
import { getProgressColor } from "@/lib/dashboard-colors";

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

  const progressColorClass = getProgressColor(progressPercentage);
  const remaining = totalTarget - totalSaved;

  return (
    <Item variant="outline" className="h-full border-0">
      <ItemContent className="space-y-5 w-full">
        {/* Total Saved, Saved This Month, Target - Grid of 3 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Total Saved</span>
            </div>
            <div className="text-base font-bold tabular-nums">
              {formatAmount(totalSaved)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>This Month</span>
            </div>
            <div className={`text-base font-bold tabular-nums ${progressColorClass}`}>
              {formatAmount(monthlySavings)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              <span>Target</span>
            </div>
            <div className="text-base font-bold tabular-nums">
              {formatAmount(totalTarget)}
            </div>
          </div>
        </div>

        {/* Progress Status */}
        <div className="text-sm">
          <span className={`font-bold ${progressColorClass}`}>
            {Math.round(progressPercentage)}%
          </span>{" "}
          <span className="text-muted-foreground">
            {progressPercentage >= 100
              ? "🎉 Goals achieved!"
              : progressPercentage >= 75
              ? "💪 Almost there!"
              : progressPercentage >= 50
              ? "📈 Halfway there!"
              : `of target • ${formatAmount(remaining)} to go`}
          </span>
        </div>
      </ItemContent>
    </Item>
  );
}
