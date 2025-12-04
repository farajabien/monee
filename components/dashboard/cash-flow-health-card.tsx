"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import {
  Heart,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
} from "lucide-react";
import type { CashFlowHealthData } from "@/lib/cash-flow-health-calculator";
import { useCurrency } from "@/hooks/use-currency";
import {
  getBalanceColor,
  getIncomeColor,
  getExpenseColor,
} from "@/lib/dashboard-colors";

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
            <div className="h-8 bg-muted rounded-lg w-3/4"></div>
            <div className="h-6 bg-muted rounded-lg w-full"></div>
            <div className="h-4 bg-muted rounded-lg w-1/2"></div>
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
          <div className="text-center py-6 w-full">
            <p className="text-sm text-muted-foreground">
              Set up your income sources to see your cash flow health
            </p>
            <p className="text-xs text-muted-foreground mt-2">
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
    percentageSpent,
    daysElapsed,
    averageDailySpend,
  } = healthData;

  // Get colors for numeric values only
  const balanceColorClass = getBalanceColor(healthStatus);
  const incomeColorClass = getIncomeColor();
  const expenseColorClass = getExpenseColor();

  // Calculate days remaining in month
  const daysRemaining = 30 - daysElapsed;

  return (
    <Item variant="outline" className="h-full border-0">
      <ItemContent className="space-y-5 w-full">
        {/* Income, Expenses, Balance - Grid of 3 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpCircle className="h-3.5 w-3.5" />
              <span>Income</span>
            </div>
            <div className={`text-lg font-bold tabular-nums ${incomeColorClass}`}>
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownCircle className="h-3.5 w-3.5" />
              <span>Expenses</span>
            </div>
            <div className={`text-lg font-bold tabular-nums ${expenseColorClass}`}>
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Balance</span>
            </div>
            <div
              className={`text-lg font-bold tabular-nums ${balanceColorClass}`}
            >
              {formatCurrency(remainingBalance)}
            </div>
          </div>
        </div>

        {/* Daily Allowance - Compact Display */}
        <div className="py-3 px-4 rounded-lg border">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Daily allowance:
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(dailyAllowance)}
            </span>
          </div>
          {dailyAllowance > 0 ? (
            <p className="text-[10px] leading-relaxed text-muted-foreground mt-1.5">
              You can spend up to {formatCurrency(dailyAllowance)} per day for
              the rest of the month.
            </p>
          ) : (
            <p className="text-[10px] leading-relaxed text-muted-foreground mt-1.5 font-medium">
              Budget exceeded - review expenses
            </p>
          )}
        </div>

        {/* Average Daily Spend & Days Elapsed */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Daily Average</span>
            <div className="text-lg font-bold tabular-nums">
              {formatCurrency(averageDailySpend)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              over {daysElapsed} day{daysElapsed !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Days Left</span>
            <div className="text-lg font-bold tabular-nums">
              {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
            </div>
            <div className="text-[10px] text-muted-foreground">
              in this month
            </div>
          </div>
        </div>

        {/* Health Status Message */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-sm font-medium leading-relaxed">
            {healthStatus === "critical" ? (
              <>
                🚨{" "}
                {remainingBalance < 0 ? (
                  <>
                    You&apos;ve overspent by{" "}
                    <span className={`font-bold tabular-nums ${expenseColorClass}`}>
                      {formatCurrency(Math.abs(remainingBalance))}
                    </span>
                    . Review your expenses!
                  </>
                ) : (
                  <>
                    You&apos;ve spent{" "}
                    <span className={`font-bold tabular-nums ${expenseColorClass}`}>
                      {percentageSpent.toFixed(0)}%
                    </span>{" "}
                    of your income. Be very careful!
                  </>
                )}
              </>
            ) : healthStatus === "caution" ? (
              <>
                ⚠️ You&apos;ve used{" "}
                <span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-400">
                  {percentageSpent.toFixed(0)}%
                </span>{" "}
                of your income. Spend carefully!
              </>
            ) : (
              <>
                ✅ Great job! You have{" "}
                <span className={`font-bold tabular-nums ${balanceColorClass}`}>
                  {formatCurrency(remainingBalance)}
                </span>{" "}
                left with {daysRemaining} days to go.
              </>
            )}
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}
