"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import db from "@/lib/db";
import { calculateCashRunway } from "@/lib/cash-runway-calculator";
import { calculateCashFlowHealth } from "@/lib/cash-flow-health-calculator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { MoneeDashboardMetric } from "@/components/custom/monee-cards";
import { DollarSign, TrendingUp, PieChart, Target } from "lucide-react";
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
  { ssr: false }
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
  const { formatCurrencyCompact } = useCurrency(
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
      {/* Dashboard Metrics Grid (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MoneeDashboardMetric
          icon={DollarSign}
          label="Total Spent"
          value={formatCurrencyCompact(totalExpenses)}
          color="primary"
        />
        <MoneeDashboardMetric
          icon={TrendingUp}
          label="Total Income"
          value={formatCurrencyCompact(totalIncome)}
          color="accent"
        />
        <MoneeDashboardMetric
          icon={PieChart}
          label="Debts Due"
          value={formatCurrencyCompact(debtsThisMonth)}
          color="secondary"
        />
        <MoneeDashboardMetric
          icon={Target}
          label="Savings Progress"
          value={`${savingsProgress}%`}
          color="accent"
        />
      </div>

      {/* Dashboard Cards - Responsive: Carousel (mobile) / Grid (desktop) */}
      {/* Mobile: Carousel */}
      <div className="block lg:hidden">
        <Carousel className="w-full" opts={{ align: "start", loop: true }}>
          <CarouselContent>
            <CarouselItem>
              <CashFlowHealthCard
                healthData={cashFlowHealthData}
                isLoading={isLoading}
                userCurrency={profile?.currency}
                userLocale={profile?.locale}
              />
            </CarouselItem>
            <CarouselItem>
              <DebtsAlertCard
                debts={debtsData}
                isLoading={isLoading}
                userCurrency={profile?.currency}
                userLocale={profile?.locale}
              />
            </CarouselItem>
            <CarouselItem>
              <SavingsProgressCard
                monthlySavings={savingsData.monthlySavings}
                totalSaved={savingsData.totalSaved}
                totalTarget={savingsData.totalTarget}
                goalsCount={savingsData.goalsCount}
                isLoading={isLoading}
                userCurrency={profile?.currency}
                userLocale={profile?.locale}
              />
            </CarouselItem>
          </CarouselContent>
          <div className="flex justify-center gap-4 mt-4">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <CashFlowHealthCard
          healthData={cashFlowHealthData}
          isLoading={isLoading}
          userCurrency={profile?.currency}
          userLocale={profile?.locale}
        />
        <DebtsAlertCard
          debts={debtsData}
          isLoading={isLoading}
          userCurrency={profile?.currency}
          userLocale={profile?.locale}
        />
        <SavingsProgressCard
          monthlySavings={savingsData.monthlySavings}
          totalSaved={savingsData.totalSaved}
          totalTarget={savingsData.totalTarget}
          goalsCount={savingsData.goalsCount}
          isLoading={isLoading}
          userCurrency={profile?.currency}
          userLocale={profile?.locale}
        />
      </div>

      {/* Metrics Insights Sections */}
      <DashboardMetricsTabs
        expenses={expenses}
        debts={debts}
        savingsGoals={savingsGoals}
        userCurrency={profile?.currency}
        userLocale={profile?.locale}
      />
    </div>
  );
}
