"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Transaction, IncomeSource } from "@/types";

export function DashboardHeader() {
  const user = db.useUser();

  // Get current month start and end timestamps
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

  // Query all transactions, income sources, and debt payments
  const { isLoading, data } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        order: { date: "desc" },
      },
    },
    income_sources: {
      $: {
        where: { "user.id": user.id, isActive: true },
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
  });

  // Calculate current month net balance
  const currentMonthNet = useMemo(() => {
    if (isLoading || !data) return 0;

    const transactions = data?.transactions || [];
    const incomeSources = data?.income_sources || [];
    const debtPayments = data?.debt_payments || [];

    // Current month transactions
    const currentMonthTransactions = transactions.filter(
      (tx: Transaction) => tx.date >= monthStartTs && tx.date <= monthEndTs
    );

    // Current month income
    const currentMonth = now.getMonth() + 1;
    const totalIncome = incomeSources.reduce(
      (sum: number, source: IncomeSource) => {
        if (source.paydayMonth && source.paydayMonth !== currentMonth) {
          return sum;
        }
        return sum + source.amount;
      },
      0
    );

    // Current month expenses
    const totalSpent = currentMonthTransactions.reduce(
      (sum: number, tx: Transaction) => sum + tx.amount,
      0
    );

    // Current month debt payments
    const totalDebtPayments = debtPayments.reduce((sum: number, payment) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentWithDebt = payment as any;
      if (paymentWithDebt.debt?.user?.id === user.id) {
        return sum + payment.amount;
      }
      return sum;
    }, 0);

    const totalExpenses = totalSpent + totalDebtPayments;
    return totalIncome - totalExpenses;
  }, [data, isLoading, monthStartTs, monthEndTs, now, user.id]);

  // Calculate running total balance (all time)
  const runningTotal = useMemo(() => {
    if (isLoading || !data) return 0;

    const transactions = data?.transactions || [];
    const incomeSources = data?.income_sources || [];
    const debtPayments = data?.debt_payments || [];

    // All time income (sum of all active income sources' amounts)
    const currentMonth = now.getMonth() + 1;
    const allTimeIncome = incomeSources.reduce(
      (sum: number, source: IncomeSource) => {
        // For recurring monthly sources, estimate based on months since creation
        // For one-time sources (with paydayMonth), only count if it's that month
        if (source.paydayMonth) {
          // One-time payment - only count if it's the current month
          if (source.paydayMonth === currentMonth) {
            return sum + source.amount;
          }
          return sum;
        }
        // Recurring monthly - estimate based on months since creation
        const createdAt = new Date(source.createdAt);
        const monthsSinceCreation = Math.max(
          1,
          (now.getFullYear() - createdAt.getFullYear()) * 12 +
            (now.getMonth() - createdAt.getMonth()) +
            1
        );
        return sum + source.amount * monthsSinceCreation;
      },
      0
    );

    // All time expenses
    const allTimeSpent = transactions.reduce(
      (sum: number, tx: Transaction) => sum + tx.amount,
      0
    );

    // All time debt payments
    const allTimeDebtPayments = debtPayments.reduce((sum: number, payment) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentWithDebt = payment as any;
      if (paymentWithDebt.debt?.user?.id === user.id) {
        return sum + payment.amount;
      }
      return sum;
    }, 0);

    const allTimeExpenses = allTimeSpent + allTimeDebtPayments;
    return allTimeIncome - allTimeExpenses;
  }, [data, isLoading, now, user.id]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage
            src={user.imageURL || undefined}
            alt={user.email || "User"}
          />
          <AvatarFallback className="text-xs sm:text-sm">
            {getInitials(user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span className="whitespace-nowrap truncate">{formatAmount(currentMonthNet)}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
              ({formatAmount(runningTotal)})
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            {now.toLocaleDateString("en-KE", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
