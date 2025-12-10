"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import db from "@/lib/db";
import { calculateCashFlowHealth } from "@/lib/cash-flow-health-calculator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Item, ItemContent } from "@/components/ui/item";
import { Calendar, Target, TrendingDown, Receipt } from "lucide-react";
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
      recipients: {},
    },
  });

  // Calculate totals
  const profile = data?.profiles?.[0];
  const expenses = useMemo(() => profile?.expenses || [], [profile?.expenses]);
  const incomeSources = useMemo(
    () => profile?.incomeSources || [],
    [profile?.incomeSources]
  );
  const debts = useMemo(() => profile?.debts || [], [profile?.debts]);
  const savingsGoals = useMemo(
    () => profile?.savingsGoals || [],
    [profile?.savingsGoals]
  );

  // Currency formatting
  const { formatCurrencyCompact, formatCurrency } = useCurrency(
    profile?.currency,
    profile?.locale
  );

  // Flatten debt payments from all debts
  const debtPayments = useMemo(
    () =>
      debts.flatMap((debt) =>
        (debt.payments || []).map((payment) => ({
          ...payment,
          debt: { id: debt.id, user: { id: profile?.id } },
        }))
      ),
    [debts, profile?.id]
  );

  // Helper function to get days until
  const getDaysUntil = useMemo(() => {
    return (timestamp: number) => {
      const today = new Date(now.getTime());
      const targetDate = new Date(timestamp);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };
  }, [now]);

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

  // Separate recurring and one-time expenses
  const recurringExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.isRecurring);
  }, [expenses]);

  const oneTimeExpenses = useMemo(() => {
    return expenses.filter((expense) => !expense.isRecurring);
  }, [expenses]);

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

  // Recipients analysis
  const recipientsData = useMemo(() => {
    const savedRecipients = profile?.recipients || [];

    const recipientTotals = expenses.reduce((acc, expense) => {
      const recipient = expense.recipient || "Unknown";
      if (!acc[recipient]) {
        // Find matching recipient data
        const recipientData = savedRecipients.find(
          (r: {
            originalName?: string;
            nickname?: string;
            paymentDetails?: Record<string, string>;
          }) => r.originalName === recipient || r.nickname === recipient
        );

        acc[recipient] = {
          recipient,
          totalAmount: 0,
          expensesCount: 0,
          paymentDetails: recipientData?.paymentDetails,
        };
      }
      acc[recipient].totalAmount += expense.amount;
      acc[recipient].expensesCount += 1;
      return acc;
    }, {} as Record<string, { recipient: string; totalAmount: number; expensesCount: number; paymentDetails?: Record<string, string> }>);

    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return Object.values(recipientTotals)
      .map((data) => ({
        ...data,
        percentageOfExpenses:
          totalExpensesAmount > 0
            ? Math.round((data.totalAmount / totalExpensesAmount) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenses, profile?.recipients]);

  // Debts data with enhanced structure - matching Debt type from types.ts
  const debtsData = useMemo(() => {
    return debts.map((debt) => {
      // Calculate next payment date from paymentDueDay
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDay = now.getDate();

      let nextPaymentDueDate: number | undefined;
      if (debt.paymentDueDay && debt.paymentDueDay >= currentDay) {
        // Payment due this month
        nextPaymentDueDate = new Date(
          currentYear,
          currentMonth,
          debt.paymentDueDay
        ).getTime();
      } else if (debt.paymentDueDay) {
        // Payment due next month
        nextPaymentDueDate = new Date(
          currentYear,
          currentMonth + 1,
          debt.paymentDueDay
        ).getTime();
      }

      // Calculate next payment amount based on debt type and monthly payment
      const nextPaymentAmount = debt.monthlyPaymentAmount || 0;

      return {
        id: debt.id,
        createdAt: debt.createdAt,
        currentBalance: debt.currentBalance,
        isActive: debt.isActive,
        debtor: debt.debtor,
        debtTaken: debt.debtTaken,
        interestRate: debt.interestRate,
        interestFrequency: debt.interestFrequency,
        repaymentTerms: debt.repaymentTerms,
        nextPaymentAmount,
        nextPaymentDueDate,
        remainingDays: debt.remainingDays,
        paymentDetails: debt.paymentDetails,
        monthlyPaymentAmount: debt.monthlyPaymentAmount,
        paymentDueDay: debt.paymentDueDay,
        compoundingFrequency: debt.compoundingFrequency,
        pushMonthsPlan: debt.pushMonthsPlan,
        pushMonthsCompleted: debt.pushMonthsCompleted,
        lastInterestPaymentDate: debt.lastInterestPaymentDate,
        interestAccrued: debt.interestAccrued,
        deadline: debt.deadline,
      };
    });
  }, [debts, now]);

  // Recurring expenses with enhanced structure
  const recurringExpensesData = useMemo(() => {
    return recurringExpenses.map((expense) => {
      // Check if paid this month
      const paidThisMonth =
        expense.date >= monthStartTs && expense.date <= monthEndTs;

      // Calculate next due date based on frequency
      let nextDueDate = expense.date;
      if (paidThisMonth && expense.expenseType) {
        const expenseDate = new Date(expense.date);
        switch (expense.expenseType) {
          case "daily":
            nextDueDate = new Date(
              expenseDate.setDate(expenseDate.getDate() + 1)
            ).getTime();
            break;
          case "weekly":
            nextDueDate = new Date(
              expenseDate.setDate(expenseDate.getDate() + 7)
            ).getTime();
            break;
          case "monthly":
            nextDueDate = new Date(
              expenseDate.setMonth(expenseDate.getMonth() + 1)
            ).getTime();
            break;
          case "yearly":
            nextDueDate = new Date(
              expenseDate.setFullYear(expenseDate.getFullYear() + 1)
            ).getTime();
            break;
          default:
            nextDueDate = expense.date;
        }
      }

      return {
        id: expense.id,
        recipient: expense.recipient,
        amount: expense.amount,
        category: expense.category || "Uncategorized",
        paidThisMonth,
        nextDueDate,
        remainingDays: getDaysUntil(nextDueDate),
        frequency: expense.expenseType,
        date: expense.date,
        paymentDetails: expense.paymentDetails,
      };
    });
  }, [recurringExpenses, monthStartTs, monthEndTs, getDaysUntil]);

  // One-time expenses with enhanced structure
  const oneTimeExpensesData = useMemo(() => {
    return oneTimeExpenses.map((expense) => ({
      id: expense.id,
      recipient: expense.recipient,
      amount: expense.amount,
      category: expense.category || "Uncategorized",
      expenseDate: expense.date,
      notes: expense.notes,
      paymentDetails: expense.paymentDetails,
    }));
  }, [oneTimeExpenses]);

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
    return debtsData.reduce(
      (sum, debt) => sum + (debt.nextPaymentAmount || 0),
      0
    );
  }, [debtsData]);

  // Calculate savings progress percentage
  const savingsProgress = useMemo(() => {
    if (savingsData.totalTarget === 0) return 0;
    return Math.round((savingsData.totalSaved / savingsData.totalTarget) * 100);
  }, [savingsData]);

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
      year: "numeric",
    });
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
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
                            {topCategories.map((categoryData) => (
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

                {/* Recipients Table */}
                {recipientsData.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4" />
                        <span>Recipients Analysis</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">
                                Recipient
                              </th>
                              <th className="text-right py-2 font-medium">
                                Total Amount
                              </th>
                              <th className="text-right py-2 font-medium">
                                Expenses Count
                              </th>
                              <th className="text-right py-2 font-medium">
                                % of Expenses
                              </th>
                              <th className="text-left py-2 font-medium">
                                Payment Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipientsData.map((data) => {
                              // Format payment details
                              const paymentDetailsText =
                                data.paymentDetails &&
                                typeof data.paymentDetails === "object"
                                  ? [
                                      data.paymentDetails.paybillNumber &&
                                        `Paybill: ${data.paymentDetails.paybillNumber}`,
                                      data.paymentDetails.tillNumber &&
                                        `Till: ${data.paymentDetails.tillNumber}`,
                                      data.paymentDetails.accountNumber &&
                                        `Acc: ${data.paymentDetails.accountNumber}`,
                                      data.paymentDetails.phoneNumber &&
                                        `Phone: ${data.paymentDetails.phoneNumber}`,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")
                                  : "—";

                              return (
                                <tr
                                  key={data.recipient}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-2">{data.recipient}</td>
                                  <td className="text-right tabular-nums">
                                    {formatCurrency(data.totalAmount)}
                                  </td>
                                  <td className="text-right tabular-nums">
                                    {data.expensesCount}
                                  </td>
                                  <td className="text-right tabular-nums">
                                    {data.percentageOfExpenses}%
                                  </td>
                                  <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                                    {paymentDetailsText}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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

                {/* My Debts Table */}
                {debtsData.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingDown className="h-4 w-4" />
                        <span>My Debts</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">
                                Debtor
                              </th>
                              <th className="text-right py-2 font-medium">
                                Debt Taken
                              </th>
                              <th className="text-left py-2 font-medium">
                                Interest Terms
                              </th>
                              <th className="text-left py-2 font-medium">
                                Repayment Terms
                              </th>
                              <th className="text-right py-2 font-medium">
                                Next Payment Amount
                              </th>
                              <th className="text-left py-2 font-medium">
                                Next Payment Due Date
                              </th>
                              <th className="text-right py-2 font-medium">
                                Remaining Days
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {debtsData.map((debt) => {
                              // Format interest terms
                              const interestTerms = debt.interestRate
                                ? `${debt.interestRate}% ${
                                    debt.interestFrequency === "monthly"
                                      ? "per month"
                                      : debt.interestFrequency === "yearly"
                                      ? "per year"
                                      : ""
                                  }`
                                : "N/A";

                              // Format next payment with options
                              const nextPaymentDisplay = debt.nextPaymentAmount
                                ? debt.repaymentTerms === "Interest Push" ||
                                  debt.repaymentTerms === "interest-push"
                                  ? `${formatCurrencyCompact(
                                      debt.nextPaymentAmount
                                    )} or ${formatCurrencyCompact(
                                      debt.currentBalance
                                    )}`
                                  : formatCurrency(debt.nextPaymentAmount)
                                : "—";

                              return (
                                <tr
                                  key={debt.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-2">{debt.debtor || "—"}</td>
                                  <td className="text-right tabular-nums">
                                    {formatCurrency(debt.debtTaken || 0)}
                                  </td>
                                  <td className="py-2">{interestTerms}</td>
                                  <td className="py-2">
                                    {debt.repaymentTerms || "—"}
                                  </td>
                                  <td className="text-right tabular-nums font-semibold">
                                    {nextPaymentDisplay}
                                  </td>
                                  <td className="py-2">
                                    {debt.nextPaymentDueDate
                                      ? formatDate(debt.nextPaymentDueDate)
                                      : "—"}
                                  </td>
                                  <td className="text-right tabular-nums">
                                    {debt.remainingDays !== undefined ? (
                                      <span
                                        className={
                                          debt.remainingDays <= 7
                                            ? "text-destructive font-semibold"
                                            : debt.remainingDays <= 14
                                            ? "text-yellow-600 font-semibold"
                                            : ""
                                        }
                                      >
                                        {debt.remainingDays}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </ItemContent>
                  </Item>
                )}
              </div>
            </TabsContent>
            <TabsContent value="expenses">
              <div className="space-y-4">
                {/* Recurring Expenses Table */}
                {recurringExpensesData.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>My Recurring Expenses</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">
                                Recipient
                              </th>
                              <th className="text-right py-2 font-medium">
                                Amount
                              </th>
                              <th className="text-left py-2 font-medium">
                                Category
                              </th>
                              <th className="text-center py-2 font-medium">
                                Paid This Month
                              </th>
                              <th className="text-left py-2 font-medium">
                                Next Due Date
                              </th>
                              <th className="text-right py-2 font-medium">
                                Remaining Days
                              </th>
                              <th className="text-left py-2 font-medium">
                                Payment Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recurringExpensesData.map((expense) => {
                              // Format payment details
                              const paymentDetailsText =
                                expense.paymentDetails &&
                                typeof expense.paymentDetails === "object"
                                  ? [
                                      expense.paymentDetails.paybillNumber &&
                                        `Paybill: ${expense.paymentDetails.paybillNumber}`,
                                      expense.paymentDetails.tillNumber &&
                                        `Till: ${expense.paymentDetails.tillNumber}`,
                                      expense.paymentDetails.accountNumber &&
                                        `Acc: ${expense.paymentDetails.accountNumber}`,
                                      expense.paymentDetails.notes,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")
                                  : "—";

                              return (
                                <tr
                                  key={expense.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-2">{expense.recipient}</td>
                                  <td className="text-right tabular-nums font-semibold">
                                    {formatCurrency(expense.amount)}
                                  </td>
                                  <td className="py-2">{expense.category}</td>
                                  <td className="text-center">
                                    <span
                                      className={
                                        expense.paidThisMonth
                                          ? "text-green-600 font-semibold"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {expense.paidThisMonth ? "YES" : "NO"}
                                    </span>
                                  </td>
                                  <td className="py-2">
                                    {formatDate(expense.nextDueDate)}
                                  </td>
                                  <td className="text-right tabular-nums">
                                    <span
                                      className={
                                        expense.remainingDays <= 7
                                          ? "text-destructive font-semibold"
                                          : expense.remainingDays <= 14
                                          ? "text-yellow-600 font-semibold"
                                          : ""
                                      }
                                    >
                                      {expense.remainingDays}
                                    </span>
                                  </td>
                                  <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                                    {paymentDetailsText}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </ItemContent>
                  </Item>
                )}

                {/* One-Time Expenses Table */}
                {oneTimeExpensesData.length > 0 && (
                  <Item variant="outline" className="border-0">
                    <ItemContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4" />
                        <span>My One-Time Expenses</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">
                                Recipient
                              </th>
                              <th className="text-right py-2 font-medium">
                                Amount
                              </th>
                              <th className="text-left py-2 font-medium">
                                Category
                              </th>
                              <th className="text-left py-2 font-medium">
                                Expense Date Time
                              </th>
                              <th className="text-left py-2 font-medium">
                                Payment Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {oneTimeExpensesData.map((expense) => {
                              // Format payment details
                              const paymentDetailsText =
                                expense.paymentDetails &&
                                typeof expense.paymentDetails === "object"
                                  ? [
                                      expense.paymentDetails.paybillNumber &&
                                        `Paybill: ${expense.paymentDetails.paybillNumber}`,
                                      expense.paymentDetails.tillNumber &&
                                        `Till: ${expense.paymentDetails.tillNumber}`,
                                      expense.paymentDetails.accountNumber &&
                                        `Acc: ${expense.paymentDetails.accountNumber}`,
                                      expense.notes ||
                                        expense.paymentDetails.notes,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")
                                  : expense.notes || "—";

                              return (
                                <tr
                                  key={expense.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="py-2">{expense.recipient}</td>
                                  <td className="text-right tabular-nums font-semibold">
                                    {formatCurrency(expense.amount)}
                                  </td>
                                  <td className="py-2">{expense.category}</td>
                                  <td className="py-2">
                                    {formatDate(expense.expenseDate)}
                                  </td>
                                  <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                                    {paymentDetailsText}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
