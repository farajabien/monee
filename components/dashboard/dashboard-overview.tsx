"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import db from "@/lib/db";
import { calculateCashRunway } from "@/lib/cash-runway-calculator";
import { calculateCashFlowHealth } from "@/lib/cash-flow-health-calculator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Item, ItemContent } from "@/components/ui/item";
import { Calendar, Target } from "lucide-react";
import { CompactItemCard } from "@/components/ui/compact-item-card";

import { useCurrency } from "@/hooks/use-currency";

// Dynamically import heavy components to avoid chunk loading issues
const DebtsAlertCard = dynamic(
  () =>
    import("./debts-alert-card").then((mod) => ({
      default: mod.DebtsAlertCard,
    })),
  { ssr: false }
);

const SavingsProgressCard = dynamic(
  () =>
    import("./savings-progress-card").then((mod) => ({
      default: mod.SavingsProgressCard,
    })),
  { ssr: false }
);

const CashFlowHealthCard = dynamic(
  () =>
    import("./cash-flow-health-card").then((mod) => ({
      default: mod.CashFlowHealthCard,
    })),
  { ssr: false }
);

const DashboardMetricsTabs = dynamic(
  () =>
    import("./dashboard-metrics-tabs").then((mod) => ({
      default: mod.DashboardMetricsTabs,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    ),
  }
);

export function DashboardOverview() {
  const user = db.useUser();

  // Get current month boundaries
  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
    [now]
  );
  const monthEnd = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    [now]
  );
  const monthStartTs = monthStart.getTime();
  const monthEndTs = monthEnd.getTime();

  // Query all required data through profile relationships
  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        where: {
          "user.id": user.id,
        },
      },
      expenses: {
        $: {
          where: {
            date: { $gte: monthStartTs, $lte: monthEndTs },
          },
        },
      },
      incomeSources: {
        $: {
          where: { isActive: true },
        },
      },
      debts: {
        payments: {
          $: {
            where: {
              paymentDate: { $gte: monthStartTs, $lte: monthEndTs },
            },
          },
        },
      },
      savingsGoals: {
        $: {
          where: { isCompleted: false },
        },
        contributions: {
          $: {
            where: {
              contributionDate: { $gte: monthStartTs, $lte: monthEndTs },
            },
          },
        },
      },
    },
  });

  // Calculate totals
  const profile = data?.profiles?.[0];
  const expenses = profile?.expenses || [];
  const incomeSources = profile?.incomeSources || [];
  const debts = profile?.debts || [];
  const savingsGoals = profile?.savingsGoals || [];

  // Currency formatting
  const { formatCurrencyCompact, formatCurrency } = useCurrency(
    profile?.currency,
    profile?.locale
  );

  // Flatten debt payments from all debts
  const debtPayments = debts.flatMap((debt) =>
    (debt.payments || []).map((payment) => ({
      ...payment,
      debt: { id: debt.id, user: { id: profile?.id } },
    }))
  );

  // Income vs Expenses calculations
  const totalIncome = useMemo(() => {
    const currentMonth = now.getMonth() + 1;
    return incomeSources
      .filter((src) => {
        if (src.paydayMonth && src.paydayMonth !== currentMonth) return false;
        return true;
      })
      .reduce((sum, src) => sum + src.amount, 0);
  }, [incomeSources, now]);

  const totalExpenses = useMemo(() => {
    const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const debtPaymentTotal = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    return expenseTotal + debtPaymentTotal;
  }, [expenses, debtPayments]);

  // Top 5 expenses by amount
  const topExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [expenses]);

  // Top 5 categories by total amount
  const topCategories = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  // Debts data
  const debtsData = useMemo(() => {
    const currentDateTs = now.getTime();

    return debts.map((debt) => {
      // Calculate next payment date from paymentDueDay
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDay = now.getDate();

      let nextPaymentDate: number;
      if (debt.paymentDueDay && debt.paymentDueDay >= currentDay) {
        // Payment due this month
        nextPaymentDate = new Date(
          currentYear,
          currentMonth,
          debt.paymentDueDay
        ).getTime();
      } else if (debt.paymentDueDay) {
        // Payment due next month
        nextPaymentDate = new Date(
          currentYear,
          currentMonth + 1,
          debt.paymentDueDay
        ).getTime();
      } else {
        // No payment day set, default to 30 days from now
        nextPaymentDate = currentDateTs + 30 * 24 * 60 * 60 * 1000;
      }

      return {
        id: debt.id,
        name: debt.name,
        nextPaymentAmount: debt.monthlyPaymentAmount ?? 0,
        nextPaymentDate,
        totalOwed: debt.currentBalance ?? debt.totalAmount ?? 0,
      };
    });
  }, [debts, now]);

  // Upcoming debts (next 5 with due dates)
  const upcomingDebts = useMemo(() => {
    const currentDateTs = now.getTime();
    return debtsData
      .filter((debt) => debt.nextPaymentDate > currentDateTs)
      .sort((a, b) => a.nextPaymentDate - b.nextPaymentDate)
      .slice(0, 5);
  }, [debtsData, now]);

  // Upcoming expenses (recurring expenses with due dates)
  const upcomingExpenses = useMemo(() => {
    const currentDateTs = now.getTime();
    // Filter expenses that have future dates within the next 30 days
    const futureExpenses = expenses
      .filter((expense) => {
        const expenseDate = expense.date;
        const thirtyDaysFromNow = currentDateTs + 30 * 24 * 60 * 60 * 1000;
        return expenseDate > currentDateTs && expenseDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);

    return futureExpenses;
  }, [expenses, now]);

  // Savings goals with nearing deadlines (top 5)
  const nearingDeadlineSavings = useMemo(() => {
    const currentDateTs = now.getTime();
    const thirtyDaysFromNow = currentDateTs + 30 * 24 * 60 * 60 * 1000;

    return savingsGoals
      .filter((goal) => {
        if (!goal.deadline) return false;
        return (
          goal.deadline > currentDateTs && goal.deadline <= thirtyDaysFromNow
        );
      })
      .sort((a, b) => (a.deadline ?? 0) - (b.deadline ?? 0))
      .slice(0, 5);
  }, [savingsGoals, now]);

  // Savings data
  const savingsData = useMemo(() => {
    const monthlySavings = savingsGoals.reduce((sum, goal) => {
      const monthlyContributions =
        goal.contributions?.reduce(
          (contributionSum, contrib) => contributionSum + contrib.amount,
          0
        ) || 0;
      return sum + monthlyContributions;
    }, 0);

    const totalSaved = savingsGoals.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0
    );
    const totalTarget = savingsGoals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0
    );

    return {
      monthlySavings,
      totalSaved,
      totalTarget,
      goalsCount: savingsGoals.length,
    };
  }, [savingsGoals]);

  // Calculate debts due this month
  const debtsThisMonth = useMemo(() => {
    return debtsData.reduce((sum, debt) => sum + debt.nextPaymentAmount, 0);
  }, [debtsData]);

  // Calculate savings progress percentage
  const savingsProgress = useMemo(() => {
    if (savingsData.totalTarget === 0) return 0;
    return Math.round((savingsData.totalSaved / savingsData.totalTarget) * 100);
  }, [savingsData]);

  // Cash runway calculation
  const cashRunwayData = useMemo(() => {
    // Require at least income sources to show cash runway
    if (!incomeSources.length) return null;

    return calculateCashRunway({
      incomeSources,
      expenses,
      debtPayments: debtPayments.map((p) => ({
        amount: p.amount,
        paymentDate: p.paymentDate,
      })),
      currentDate: now,
    });
  }, [incomeSources, expenses, debtPayments, now]);

  // Cash flow health calculation
  const cashFlowHealthData = useMemo(() => {
    // Require at least income sources to show cash flow health
    if (!incomeSources.length) return null;

    return calculateCashFlowHealth({
      incomeSources,
      expenses, // Note: excludes debt payments per user requirement
      currentDate: now,
      monthlyBudget: profile?.monthlyBudget ?? 0,
    });
  }, [incomeSources, expenses, now, profile?.monthlyBudget]);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(profile?.locale || "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get days until
  const getDaysUntil = (timestamp: number) => {
    const today = new Date(now.getTime());
    const targetDate = new Date(timestamp);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">
          Error loading dashboard: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Dashboard Cards with nested tabs */}
        <TabsContent value="overview">
          <Tabs defaultValue="cashflow" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>
            <TabsContent value="cashflow">
              <div className="space-y-4">
                <CashFlowHealthCard
                  healthData={cashFlowHealthData}
                  isLoading={isLoading}
                  userCurrency={profile?.currency}
                  userLocale={profile?.locale}
                  totalExpenses={totalExpenses}
                  totalIncome={totalIncome}
                  debtsThisMonth={debtsThisMonth}
                  savingsProgress={savingsProgress}
                />

                {/* Top 5 Expenses and Categories */}
                {(topExpenses.length > 0 || topCategories.length > 0) && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <Tabs defaultValue="expenses" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="expenses">
                            Top 5 Expenses
                          </TabsTrigger>
                          <TabsTrigger value="categories">
                            Top 5 Categories
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="expenses" className="mt-3">
                          <div className="space-y-2">
                            {topExpenses.map((expense, index) => (
                              <CompactItemCard
                                key={expense.id}
                                index={index}
                                title={expense.recipient}
                                amount={formatCurrency(expense.amount)}
                                amountColor="destructive"
                                category={expense.category}
                                date={formatDate(expense.date)}
                                isRecurring={expense.isRecurring}
                                actions={{
                                  onEdit: () => {
                                    // TODO: Implement edit
                                  },
                                  onDelete: () => {
                                    // TODO: Implement delete
                                  },
                                }}
                              />
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="categories" className="mt-3">
                          <div className="space-y-2">
                            {topCategories.map((categoryData, index) => (
                              <div
                                key={categoryData.category}
                                className="flex items-center justify-between py-2 border-b last:border-0"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium">
                                    {categoryData.category}
                                  </p>
                                </div>
                                <div className="text-sm font-semibold tabular-nums text-destructive">
                                  {formatCurrency(categoryData.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </ItemContent>
                  </Item>
                )}
              </div>
            </TabsContent>
            <TabsContent value="debts">
              <div className="space-y-4">
                <DebtsAlertCard
                  debts={debtsData}
                  isLoading={isLoading}
                  userCurrency={profile?.currency}
                  userLocale={profile?.locale}
                />

                {/* Upcoming Debts List (Top 5) */}
                {upcomingDebts.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>Upcoming Payments (Top 5)</span>
                      </div>
                      <div className="space-y-2">
                        {upcomingDebts.map((debt) => {
                          const daysUntil = getDaysUntil(debt.nextPaymentDate);
                          return (
                            <div
                              key={debt.id}
                              className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                  {debt.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(debt.nextPaymentDate)} •{" "}
                                  {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="text-sm font-semibold tabular-nums">
                                {formatCurrency(debt.nextPaymentAmount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ItemContent>
                  </Item>
                )}
              </div>
            </TabsContent>
            <TabsContent value="savings">
              <div className="space-y-4">
                <SavingsProgressCard
                  monthlySavings={savingsData.monthlySavings}
                  totalSaved={savingsData.totalSaved}
                  totalTarget={savingsData.totalTarget}
                  goalsCount={savingsData.goalsCount}
                  isLoading={isLoading}
                  userCurrency={profile?.currency}
                  userLocale={profile?.locale}
                />

                {/* Savings Goals with Nearing Deadlines (Top 5) */}
                {nearingDeadlineSavings.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="h-4 w-4" />
                        <span>Nearing Deadlines (Top 5)</span>
                      </div>
                      <div className="space-y-2">
                        {nearingDeadlineSavings.map((goal) => {
                          const daysUntil = getDaysUntil(goal.deadline ?? 0);
                          const progress =
                            goal.targetAmount > 0
                              ? Math.round(
                                  (goal.currentAmount / goal.targetAmount) * 100
                                )
                              : 0;
                          return (
                            <div
                              key={goal.id}
                              className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                              <div className="space-y-0.5 flex-1">
                                <p className="text-sm font-medium">
                                  {goal.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(goal.deadline ?? 0)} • {daysUntil}{" "}
                                  day{daysUntil !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">
                                  {progress}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrencyCompact(goal.currentAmount)} /{" "}
                                  {formatCurrencyCompact(goal.targetAmount)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ItemContent>
                  </Item>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Insights Tab - Metrics Insights Sections */}
        <TabsContent value="insights">
          <DashboardMetricsTabs
            expenses={expenses}
            debts={debts}
            savingsGoals={savingsGoals}
            userCurrency={profile?.currency}
            userLocale={profile?.locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
