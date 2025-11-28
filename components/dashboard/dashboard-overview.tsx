"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import db from "@/lib/db";
import { calculateCashRunway } from "@/lib/cash-runway-calculator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const CashRunwayCard = dynamic(
  () =>
    import("./cash-runway-card").then((mod) => ({
      default: mod.CashRunwayCard,
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

  // Query all required data
  const { isLoading, error, data } = db.useQuery({
    expenses: {
      $: {
        where: {
          "user.id": user.id,
          date: { $gte: monthStartTs, $lte: monthEndTs },
        },
      },
    },
    income_sources: {
      $: {
        where: { "user.id": user.id, isActive: true },
      },
    },
    debts: {
      $: {
        where: { "user.id": user.id },
      },
    },
    debt_payments: {
      $: {
        where: {
          paymentDate: { $gte: monthStartTs, $lte: monthEndTs },
        },
      },
      debt: {
        user: {},
      },
    },
    savings_goals: {
      $: {
        where: { "user.id": user.id, isCompleted: false },
      },
      contributions: {
        $: {
          where: {
            contributionDate: { $gte: monthStartTs, $lte: monthEndTs },
          },
        },
      },
    },
  });

  // Calculate totals
  const expenses = data?.expenses || [];
  const incomeSources = data?.income_sources || [];
  const debts = data?.debts || [];
  const debtPayments = data?.debt_payments || [];
  const savingsGoals = data?.savings_goals || [];

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
    const debtPaymentTotal = debtPayments
      .filter((p) => p.debt?.user?.id === user.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return expenseTotal + debtPaymentTotal;
  }, [expenses, debtPayments, user.id]);

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

  // Cash runway calculation
  const cashRunwayData = useMemo(() => {
    // Require at least income sources to show cash runway
    if (!incomeSources.length) return null;

    return calculateCashRunway({
      incomeSources,
      expenses,
      debtPayments: debtPayments
        .filter((p) => p.debt?.user?.id === user.id)
        .map((p) => ({
          amount: p.amount,
          paymentDate: p.paymentDate,
        })),
      currentDate: now,
    });
  }, [incomeSources, expenses, debtPayments, user.id, now]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Cards as Tabs */}
      <Tabs defaultValue="runway" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 border-0">
          <TabsTrigger value="runway" className="border-0">
            Cash Runway
          </TabsTrigger>
          <TabsTrigger value="debts" className="border-0">
            Debts
          </TabsTrigger>
          <TabsTrigger value="savings" className="border-0">
            Savings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="runway" className="border-0">
          <CashRunwayCard
            runwayData={cashRunwayData}
            isLoading={isLoading}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            monthlySavings={savingsData.monthlySavings}
          />
        </TabsContent>
        <TabsContent value="debts" className="border-0">
          <DebtsAlertCard debts={debtsData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="savings" className="border-0">
          <SavingsProgressCard
            monthlySavings={savingsData.monthlySavings}
            totalSaved={savingsData.totalSaved}
            totalTarget={savingsData.totalTarget}
            goalsCount={savingsData.goalsCount}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Link to Detailed Summary */}
      <div className="flex justify-center pt-4">
        <Link href="/dashboard?tab=overview&view=detailed">
          <Button variant="outline" size="sm" className="border-0">
            View Detailed Summary
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
