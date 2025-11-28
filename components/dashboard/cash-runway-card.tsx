"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CashRunwayData } from "@/lib/cash-runway-calculator";
import {
  formatCurrency,
  getCashRunwayMessage,
  getDisciplineMessage,
} from "@/lib/cash-runway-calculator";

interface CashRunwayCardProps {
  runwayData: CashRunwayData | null;
  isLoading?: boolean;
}

export function CashRunwayCard({
  runwayData,
  isLoading = false,
}: CashRunwayCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Cash Runway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No runway data case (no income sources set up)
  if (!runwayData || !runwayData.nextPaydayDate) {
    return (
      <Card className="h-full bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            Cash Runway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Set up your income sources to see predictions
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll tell you if you'll make it to payday!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    currentCash,
    daysToPayday,
    dailyAverageSpend,
    projectedBalance,
    willMakeIt,
    disciplineIndicator,
    statusEmoji,
    statusColor,
    nextPaydayDate,
    projectedDailyBudget,
  } = runwayData;

  // Determine card styling based on status
  const cardClass =
    statusColor === "success"
      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
      : statusColor === "warning"
      ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
      : "border-red-500 bg-red-50/50 dark:bg-red-950/20";

  const amountClass =
    statusColor === "success"
      ? "text-green-600"
      : statusColor === "warning"
      ? "text-yellow-600"
      : "text-red-600";

  // Get discipline icon
  const DisciplineIcon =
    disciplineIndicator === "up"
      ? TrendingUp
      : disciplineIndicator === "down"
      ? TrendingDown
      : Minus;

  const disciplineColorClass =
    disciplineIndicator === "up"
      ? "text-green-600"
      : disciplineIndicator === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card className={`h-full ${cardClass}`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          Cash Runway {statusEmoji}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Cash Left */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Cash Remaining</div>
          <div className={`text-3xl font-bold ${amountClass}`}>
            {formatCurrency(currentCash)}
          </div>
        </div>

        {/* Days to Payday */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Until Payday</span>
            <span className="text-xl font-bold">
              {daysToPayday} day{daysToPayday !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {nextPaydayDate.toLocaleDateString("en-KE", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Daily Average Spend with Discipline Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily Average</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {formatCurrency(dailyAverageSpend)}
              </span>
              <DisciplineIcon
                className={`h-4 w-4 ${disciplineColorClass}`}
              />
            </div>
          </div>
          <div className={`text-xs ${disciplineColorClass} flex items-center gap-1`}>
            {getDisciplineMessage(disciplineIndicator)}
          </div>
        </div>

        {/* Projection */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-sm font-medium">
            {getCashRunwayMessage(runwayData)}
          </div>
          {!willMakeIt ? (
            <div className="text-xs text-red-600 dark:text-red-400">
              Try to spend max {formatCurrency(projectedDailyBudget)}/day to make it!
            </div>
          ) : projectedBalance < dailyAverageSpend * 5 ? (
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              Spend carefully to maintain your buffer.
            </div>
          ) : (
            <div className="text-xs text-green-600 dark:text-green-400">
              You can spend up to {formatCurrency(projectedDailyBudget)}/day.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
