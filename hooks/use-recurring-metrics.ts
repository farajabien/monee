"use client";

import { useMemo } from "react";

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: string; // weekly | biweekly | monthly | quarterly | annually
  isActive?: boolean;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDueDate?: number;
  isActive?: boolean;
  paidThisMonth?: boolean;
}

interface Debt {
  id: string;
  debtor?: string;
  currentBalance: number;
  monthlyPaymentAmount?: number;
  nextPaymentAmount?: number;
  nextPaymentDueDate?: number;
  isActive?: boolean;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: string;
  status: string;
  savedAmount?: number;
}

export interface DueItem {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
  type: "recurring" | "debt";
}

export interface RecurringMetrics {
  mri: number; // Monthly Recurring Income
  wri: number; // Weekly Recurring Income
  tro: number; // Total Recurring Outflows
  edp: number; // Expected Debt Payments this month
  nrcf: number; // Net Recurring Cash Flow
  coverRatio: number; // MRI / (TRO + EDP)
  next30DaysDue: DueItem[];
  wishlistTotal: number;
  wishlistSaved: number;
  wishlistGap: number;
}

// Convert any frequency to monthly equivalent
function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "annually":
    case "yearly":
      return amount / 12;
    default:
      return amount; // Assume monthly if unknown
  }
}

// Get sum of weekly frequency items only
function getWeeklySum(items: { amount: number; frequency: string }[]): number {
  return items
    .filter((item) => item.frequency?.toLowerCase() === "weekly")
    .reduce((sum, item) => sum + item.amount, 0);
}

export function useRecurringMetrics(
  incomeSources: IncomeSource[],
  recurringTransactions: RecurringTransaction[],
  debts: Debt[],
  wishlistItems: WishlistItem[]
): RecurringMetrics {
  return useMemo(() => {
    // Filter active items
    const activeIncomes = incomeSources.filter((inc) => inc.isActive !== false);
    const activeRecurring = recurringTransactions.filter(
      (rt) => rt.isActive !== false
    );
    const activeDebts = debts.filter((d) => d.isActive !== false);
    const activeWishlist = wishlistItems.filter(
      (w) => w.status === "wishlist"
    );

    // Monthly Recurring Income (MRI)
    const mri = activeIncomes.reduce(
      (sum, inc) => sum + toMonthlyAmount(inc.amount, inc.frequency),
      0
    );

    // Weekly Recurring Income (WRI) - just weekly incomes
    const wri = getWeeklySum(activeIncomes);

    // Total Recurring Outflows (TRO) - subscriptions, rent, etc.
    const tro = activeRecurring.reduce(
      (sum, rt) => sum + toMonthlyAmount(rt.amount, rt.frequency),
      0
    );

    // Expected Debt Payments this month (EDP)
    const edp = activeDebts.reduce((sum, debt) => {
      const payment = debt.monthlyPaymentAmount || debt.nextPaymentAmount || 0;
      return sum + payment;
    }, 0);

    // Net Recurring Cash Flow (NRCF)
    const nrcf = mri - tro - edp;

    // Cover Ratio
    const obligations = tro + edp;
    const coverRatio = obligations > 0 ? mri / obligations : mri > 0 ? 999 : 0;

    // Next 30 days due items
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const recurringDue: DueItem[] = activeRecurring
      .filter(
        (rt) =>
          rt.nextDueDate && rt.nextDueDate >= now && rt.nextDueDate <= thirtyDaysFromNow
      )
      .map((rt) => ({
        id: rt.id,
        name: rt.name,
        amount: rt.amount,
        dueDate: rt.nextDueDate!,
        type: "recurring" as const,
      }));

    const debtsDue: DueItem[] = activeDebts
      .filter(
        (d) =>
          d.nextPaymentDueDate &&
          d.nextPaymentDueDate >= now &&
          d.nextPaymentDueDate <= thirtyDaysFromNow
      )
      .map((d) => ({
        id: d.id,
        name: d.debtor || "Debt Payment",
        amount: d.monthlyPaymentAmount || d.nextPaymentAmount || 0,
        dueDate: d.nextPaymentDueDate!,
        type: "debt" as const,
      }));

    const next30DaysDue = [...recurringDue, ...debtsDue].sort(
      (a, b) => a.dueDate - b.dueDate
    );

    // Wishlist calculations
    const wishlistTotal = activeWishlist.reduce((sum, w) => sum + w.price, 0);
    const wishlistSaved = activeWishlist.reduce(
      (sum, w) => sum + (w.savedAmount || 0),
      0
    );
    const wishlistGap = wishlistTotal - wishlistSaved;

    return {
      mri,
      wri,
      tro,
      edp,
      nrcf,
      coverRatio,
      next30DaysDue,
      wishlistTotal,
      wishlistSaved,
      wishlistGap,
    };
  }, [incomeSources, recurringTransactions, debts, wishlistItems]);
}
