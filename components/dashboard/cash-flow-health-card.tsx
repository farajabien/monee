"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Calendar,
} from "lucide-react";
import type { CashFlowHealthData } from "@/lib/cash-flow-health-calculator";
import { useCurrency } from "@/hooks/use-currency";
import { Badge } from "../ui/badge";

interface CashFlowHealthCardProps {
  healthData: CashFlowHealthData | null;
  isLoading?: boolean;
  userCurrency?: string;
  userLocale?: string;
}

export function CashFlowHealthCard({
  healthData,
  isLoading = false,
  userCurrency,
  userLocale,
}: CashFlowHealthCardProps) {
  const { formatCurrency } = useCurrency(userCurrency, userLocale);

  if (isLoading) {
    return (
      <Item variant="outline" className="h-full border-0">
        <ItemHeader className="sr-only">
          <ItemTitle>
            <Heart className="h-4 w-4" />
            Cash Flow Health
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

  // No health data case (no income sources set up)
  if (!healthData || healthData.totalIncome === 0) {
    return (
      <Item variant="muted" className="h-full border-0">
        <ItemContent>
          <div className="text-center py-4 w-full">
            <p className="text-sm text-muted-foreground">
              Set up your income sources to see your cash flow health
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Track your financial health in real-time!
            </p>
          </div>
        </ItemContent>
      </Item>
    );
  }

  const {
    totalIncome,
    totalExpenses,
    remainingBalance,
    dailyAllowance,
    healthStatus,
    disciplineIndicator,
    statusColor,
    percentageSpent,
    daysElapsed,
    averageDailySpend,
  } = healthData;

  // Determine item styling based on status
  const itemClass =
    statusColor === "success"
      ? " bg-green-50/50 dark:bg-green-950/20"
      : statusColor === "warning"
      ? " bg-yellow-50/50 dark:bg-yellow-950/20"
      : " bg-red-50/50 dark:bg-red-950/20";

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

  // Determine balance color based on health status
  const balanceColorClass =
    healthStatus === "healthy"
      ? "text-green-600 dark:text-green-400"
      : healthStatus === "caution"
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  // Calculate days remaining in month
  const daysRemaining = 30 - daysElapsed;

  return (
    <Item variant="outline" className={`h-full border-0 ${itemClass}`}>
      <ItemContent className="space-y-4 w-full">
        {/* Income, Expenses, Balance - Grid of 3 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              Income
            </div>
            <div className="text-base font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
              Expenses
            </div>
            <div className="text-base font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Balance
            </div>
            <div className={`text-base font-semibold ${balanceColorClass}`}>
              {formatCurrency(remainingBalance)}
            </div>
          </div>
        </div>

        {/* Daily Allowance - Compact Display */}
        <div className="py-2 px-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-blue-800 dark:text-blue-200">
              Daily allowance:
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(dailyAllowance)}
            </span>
          </div>
          {dailyAllowance > 0 ? (
            <p className="text-[10px] text-blue-700/70 dark:text-blue-300/70 mt-1">
              Stay disciplined to grow your balance
            </p>
          ) : (
            <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
              Budget exceeded - review expenses
            </p>
          )}
        </div>

        {/* Average Daily Spend & Days Elapsed */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Daily Average</span>
            <div className="text-base font-semibold">
              {formatCurrency(averageDailySpend)}
            </div>
            <div className="text-xs text-muted-foreground">
              over {daysElapsed} day{daysElapsed !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Days Left</span>
            <div className="text-base font-semibold">
              {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-muted-foreground">in this month</div>
          </div>
        </div>

        {/* Health Status Message */}
        <div className="pt-2">
          <div
            className={`text-sm font-medium ${
              healthStatus === "critical"
                ? "text-red-600 dark:text-red-400"
                : healthStatus === "caution"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {healthStatus === "critical" ? (
              <>
                🚨{" "}
                {remainingBalance < 0 ? (
                  <>
                    You&apos;ve overspent by{" "}
                    <span className="font-bold">
                      {formatCurrency(Math.abs(remainingBalance))}
                    </span>
                    . Review your expenses!
                  </>
                ) : (
                  <>
                    You&apos;ve spent {percentageSpent.toFixed(0)}% of your
                    income. Be very careful!
                  </>
                )}
              </>
            ) : healthStatus === "caution" ? (
              <>
                ⚠️ You&apos;ve used {percentageSpent.toFixed(0)}% of your
                income. Spend carefully!
              </>
            ) : (
              <>
                ✅ Great job! You have{" "}
                <Badge variant="outline" className="text-xs">
                  {formatCurrency(remainingBalance)}
                </Badge>{" "}
                left with {daysRemaining} days to go.
              </>
            )}
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}
