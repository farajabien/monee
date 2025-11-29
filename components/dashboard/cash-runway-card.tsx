"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import {
  Rocket,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import type { CashRunwayData } from "@/lib/cash-runway-calculator";
import { formatCurrency } from "@/lib/cash-runway-calculator";

interface CashRunwayCardProps {
  runwayData: CashRunwayData | null;
  isLoading?: boolean;
  totalIncome?: number;
  totalExpenses?: number;
  monthlySavings?: number;
}

export function CashRunwayCard({
  runwayData,
  isLoading = false,
  totalIncome = 0,
  totalExpenses = 0,
  monthlySavings = 0,
}: CashRunwayCardProps) {
  if (isLoading) {
    return (
      <Item variant="outline" className="h-full border-0">
        <ItemHeader className="sr-only">
          <ItemTitle>
            <Rocket className="h-4 w-4" />
            Cash Runway
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

  // No runway data case (no income sources set up)
  if (!runwayData || !runwayData.nextPaydayDate) {
    return (
      <Item variant="muted" className="h-full border-0">
        <ItemContent>
          <div className="text-center py-4 w-full">
            <p className="text-sm text-muted-foreground">
              Set up your income sources to see predictions
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We&apos;ll tell you if you&apos;ll make it to payday!
            </p>
          </div>
        </ItemContent>
      </Item>
    );
  }

  const {
    currentCash,
    daysToPayday,
    dailyAverageSpend,
    projectedBalance,
    willMakeIt,
    disciplineIndicator,
    statusColor,
    nextPaydayDate,
    projectedDailyBudget,
  } = runwayData;

  // Determine item styling based on status
  const itemClass =
    statusColor === "success"
      ? " bg-green-50/50 dark:bg-green-950/20"
      : statusColor === "warning"
      ? " bg-yellow-50/50 dark:bg-yellow-950/20"
      : " bg-red-50/50 dark:bg-red-950/20";

  const amountClass =
    statusColor === "success"
      ? "text-green-600 dark:text-green-400"
      : statusColor === "warning"
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  // Get discipline icon
  const DisciplineIcon =
    disciplineIndicator === "up"
      ? TrendingUp
      : disciplineIndicator === "down"
      ? TrendingDown
      : Minus;

  const disciplineColorClass =
    disciplineIndicator === "up"
      ? "text-green-600 dark:text-green-400"
      : disciplineIndicator === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  // Calculate net flow
  const netFlow = totalIncome - totalExpenses;
  const isPositiveFlow = netFlow >= 0;

  // Calculate savings rate
  const savingsRate =
    totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;
  const savingsRateColor =
    savingsRate >= 20
      ? "text-green-600 dark:text-green-400"
      : savingsRate >= 10
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-muted-foreground";

  return (
    <Item variant="outline" className={`h-full border-0 ${itemClass}`}>
      <ItemContent className="space-y-4 w-full">
        {/* Income vs Expenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              Income
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
              Expenses
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
        </div>

        {/* Net Flow + Savings Rate Combined */}
        <div className="grid grid-cols-2 gap-3 py-2 px-3 rounded-md bg-muted/50">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Net Flow</span>
            <div
              className={`text-sm font-semibold ${
                isPositiveFlow
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositiveFlow ? "+" : ""}
              {formatCurrency(netFlow)}
            </div>
          </div>
          {totalIncome > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Savings Rate
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${savingsRateColor}`}>
                  {savingsRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  • {formatCurrency(monthlySavings)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Days to Payday */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Until Payday</span>
          <div className="text-right">
            <span className="text-xl font-bold">
              {daysToPayday} day{daysToPayday !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">
              •{" "}
              {nextPaydayDate.toLocaleDateString("en-KE", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Daily Average Spend with Discipline Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Daily Average</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {formatCurrency(dailyAverageSpend)}
            </span>
            <DisciplineIcon className={`h-4 w-4 ${disciplineColorClass}`} />
          </div>
        </div>

        {/* Projection */}
        <div className="pt-3">
          <div
            className={`text-sm font-medium ${
              !willMakeIt
                ? "text-red-600 dark:text-red-400"
                : projectedBalance < dailyAverageSpend * 5
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {!willMakeIt ? (
              <>
                ⚠ Short by payday. Max{" "}
                <span className="font-bold text-base">
                  {formatCurrency(projectedDailyBudget)}
                </span>
                /day to make it!
              </>
            ) : projectedBalance < dailyAverageSpend * 5 ? (
              <>
                ⚡ On track! Max{" "}
                <span className="font-bold text-base">
                  {formatCurrency(projectedDailyBudget)}
                </span>
                /day to maintain buffer.
              </>
            ) : (
              <>
                ✓ On track! Max{" "}
                <span className="font-bold text-base">
                  {formatCurrency(projectedDailyBudget)}
                </span>
                /day to payday.
              </>
            )}
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}
