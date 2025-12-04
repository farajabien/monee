"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import {
  Heart,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingDown,
  Target,
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
  totalExpenses?: number;
  totalIncome?: number;
  debtsThisMonth?: number;
  savingsProgress?: number;
}

export function CashFlowHealthCard({
  healthData,
  isLoading = false,
  userCurrency,
  userLocale,
  totalExpenses,
  totalIncome,
  debtsThisMonth,
  savingsProgress,
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
          <div className="animate-pulse space-y-4 w-full">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
            </div>
          </div>
        </ItemContent>
      </Item>
    );
  }

  if (!healthData || healthData.totalIncome === 0) {
    return (
      <Item variant="muted" className="h-full border-0">
        <ItemContent>
          <div className="text-center py-8 w-full space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No income data yet
              </p>
              <p className="text-xs text-muted-foreground">
                Set up your income sources to track your cash flow health
              </p>
            </div>
          </div>
        </ItemContent>
      </Item>
    );
  }

  const {
    totalIncome: healthTotalIncome,
    totalExpenses: healthTotalExpenses,
    remainingBalance,
    dailyAllowance,
    healthStatus,
    percentageSpent,
    daysElapsed,
    averageDailySpend,
  } = healthData;

  const balanceColorClass = getBalanceColor(healthStatus);
  const incomeColorClass = getIncomeColor();
  const expenseColorClass = getExpenseColor();
  const daysRemaining = 30 - daysElapsed;

  return (
    <Item variant="outline" className="h-full border-0">
      <ItemContent className="space-y-6 w-full">
        {/* Income, Expenses, Balance */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpCircle className="h-3.5 w-3.5" />
              <span>Income</span>
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${incomeColorClass}`}
            >
              {formatCurrency(healthTotalIncome)}
            </div>
            {totalIncome !== undefined && totalIncome !== healthTotalIncome && (
              <div className="text-[10px] text-muted-foreground">
                Total: {formatCurrency(totalIncome)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownCircle className="h-3.5 w-3.5" />
              <span>Expenses</span>
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${expenseColorClass}`}
            >
              {formatCurrency(healthTotalExpenses)}
            </div>
            {totalExpenses !== undefined &&
              totalExpenses !== healthTotalExpenses && (
                <div className="text-[10px] text-muted-foreground">
                  Total: {formatCurrency(totalExpenses)}
                </div>
              )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Balance</span>
            </div>
            <div
              className={`text-xl font-bold tabular-nums ${balanceColorClass}`}
            >
              {formatCurrency(remainingBalance)}
            </div>
          </div>
        </div>

        {/* Savings Progress - Compact */}
        {savingsProgress !== undefined && savingsProgress > 0 && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Savings
                </span>
              </div>
              <div className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300">
                {savingsProgress}%
              </div>
            </div>
          </div>
        )}

        {/* Daily Allowance with Health Status */}
        <div className="rounded-lg bg-muted/50 p-3">
          <DailyAllowanceMessage
            dailyAllowance={dailyAllowance}
            healthStatus={healthStatus}
            remainingBalance={remainingBalance}
            percentageSpent={percentageSpent}
            daysRemaining={daysRemaining}
            userCurrency={userCurrency ?? "USD"}
            userLocale={userLocale ?? "en-US"}
          />
        </div>

        {/* Debts Due This Month */}
        {debtsThisMonth !== undefined && debtsThisMonth > 0 && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Debts Due
              </span>
            </div>
            <div className="text-sm font-bold tabular-nums text-orange-700 dark:text-orange-300">
              {formatCurrency(debtsThisMonth)}
            </div>
          </div>
        )}
      </ItemContent>
    </Item>
  );
}

const DailyAllowanceMessage = ({
  dailyAllowance,
  healthStatus,
  remainingBalance,
  percentageSpent,
  daysRemaining,
  userCurrency,
  userLocale,
}: {
  dailyAllowance: number;
  healthStatus: "healthy" | "caution" | "critical";
  remainingBalance: number;
  percentageSpent: number;
  daysRemaining: number;
  userCurrency: string;
  userLocale: string;
}) => {
  const { formatCurrency } = useCurrency(userCurrency, userLocale);
  const balanceColorClass = getBalanceColor(healthStatus);
  const expenseColorClass = getExpenseColor();

  if (healthStatus === "critical") {
    return (
      <p className="text-sm font-medium leading-relaxed">
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
      </p>
    );
  }

  if (healthStatus === "caution") {
    return (
      <p className="text-sm font-medium leading-relaxed">
        ⚠️ You&apos;ve used{" "}
        <span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-400">
          {percentageSpent.toFixed(0)}%
        </span>{" "}
        of your income. Spend carefully!
      </p>
    );
  }

  if (dailyAllowance > 0) {
    return (
      <p className="text-sm font-medium leading-relaxed">
        ✅ You can spend up to{" "}
        <span className="font-bold tabular-nums">
          {formatCurrency(dailyAllowance)}
        </span>{" "}
        per day with{" "}
        <span className={`font-bold tabular-nums ${balanceColorClass}`}>
          {formatCurrency(remainingBalance)}
        </span>{" "}
        left for <b>{daysRemaining}</b> days.
      </p>
    );
  }

  return (
    <p className="text-sm font-medium text-destructive">
      Budget exceeded - review expenses
    </p>
  );
};
