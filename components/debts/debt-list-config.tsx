/**
 * Debt List Configuration
 *
 * Defines how debts are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { DebtWithUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingDown,
  CheckCircle,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import db from "@/lib/db";

// Helper functions
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatCompactAmount = (amount: number) => {
  if (amount >= 1000000) return `💰${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `💰${(amount / 1000).toFixed(0)}K`;
  return `💰${amount}`;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const calculateProgress = (debt: DebtWithUser) => {
  if (debt.totalAmount === 0) return 100;
  const paid = debt.totalAmount - debt.currentBalance;
  return (paid / debt.totalAmount) * 100;
};

const calculatePayoffMonths = (debt: DebtWithUser) => {
  if (debt.monthlyPaymentAmount === 0) return null;
  return Math.ceil(debt.currentBalance / debt.monthlyPaymentAmount);
};

const isDueToday = (debt: DebtWithUser) => {
  const today = new Date();
  return today.getDate() === debt.paymentDueDay;
};

// Calculate the appropriate payment amount to display based on debt type
const getPaymentDisplay = (debt: DebtWithUser) => {
  const debtType = (debt.debtType || "one-time") as string;
  
  if (debtType === "one-time") {
    // One-time: show full amount due
    return {
      amount: debt.currentBalance,
      label: "Due",
      isMonthly: false,
    };
  } else if (debtType === "interest-push") {
    // Interest-push: calculate monthly interest to keep principal intact
    const monthlyInterest = debt.interestRate 
      ? (debt.currentBalance * debt.interestRate / 100) / 12
      : 0;
    return {
      amount: monthlyInterest,
      label: "Interest/mo",
      isMonthly: true,
    };
  } else {
    // Amortizing: show monthly payment (principal + interest)
    return {
      amount: debt.monthlyPaymentAmount,
      label: "Payment/mo",
      isMonthly: true,
    };
  }
};

// Get due date display based on debt type
const getDueDateDisplay = (debt: DebtWithUser) => {
  const debtType = (debt.debtType || "one-time") as string;
  
  if (debtType === "one-time" && debt.deadline) {
    return {
      text: formatDate(debt.deadline),
      label: "Deadline",
    };
  } else if (debtType === "interest-push" && debt.deadline) {
    return {
      text: formatDate(debt.deadline),
      label: "Next payment",
    };
  } else if (debt.paymentDueDay > 0) {
    return {
      text: `Day ${debt.paymentDueDay}`,
      label: "Due",
    };
  }
  return null;
};

export const createDebtListConfig = (
  onRecordPayment: (debt: DebtWithUser) => void,
  onQuickPush: (debt: DebtWithUser) => void,
  onEdit: (debt: DebtWithUser) => void
): ListConfig<DebtWithUser> => ({
  // Identity
  queryKey: "debts",

  // Display
  title: "Debts",
  description: "Track and manage your debts",
  emptyMessage: "No debts tracked yet. Add debts to manage payments",
  emptyMessageFiltered: "No debts found matching your filters",
  searchPlaceholder: "Search debts...",

  // Filters & Sort
  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "paid", label: "Paid Off" },
        { value: "due-today", label: "Due Today" },
      ],
    },
  ] as FilterConfig[],

  sortOptions: [
    { value: "balance-desc", label: "Balance (High to Low)" },
    { value: "balance-asc", label: "Balance (Low to High)" },
    { value: "progress-desc", label: "Progress" },
    { value: "due-day-asc", label: "Due Day" },
    { value: "deadline-asc", label: "Deadline" },
  ],
  defaultSort: "balance-desc",
  searchFields: ["name"],

  // Metrics
  metrics: [
    {
      key: "totalDebt",
      label: "Total Debt",
      type: "currency",
      icon: "💰",
    },
    {
      key: "activeCount",
      label: "Active",
      type: "count",
      icon: TrendingDown,
    },
    {
      key: "totalPaid",
      label: "Total Paid",
      type: "currency",
      icon: "💰",
    },
    {
      key: "avgProgress",
      label: "Avg Progress",
      type: "percentage",
      icon: Clock,
    },
  ],

  calculateMetrics: (items: DebtWithUser[]) => {
    const activeDebts = items.filter((d) => d.currentBalance > 0);
    const totalDebt = activeDebts.reduce(
      (sum, debt) => sum + debt.currentBalance,
      0
    );
    const totalOriginal = activeDebts.reduce(
      (sum, debt) => sum + debt.totalAmount,
      0
    );
    const totalPaid = totalOriginal - totalDebt;
    const avgProgress =
      activeDebts.length > 0
        ? activeDebts.reduce((sum, d) => sum + calculateProgress(d), 0) /
          activeDebts.length
        : 0;

    return {
      totalDebt,
      activeCount: activeDebts.length,
      totalPaid,
      avgProgress,
    };
  },

  // Views
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: DebtWithUser, index: number, actions) => {
    const progress = calculateProgress(item);
    const payoffMonths = calculatePayoffMonths(item);
    const isPaidOff = item.currentBalance === 0;
    const debtType = (item.debtType || "one-time") as string;
    const paymentDisplay = getPaymentDisplay(item);
    const dueDateDisplay = getDueDateDisplay(item);

    // Debt type badge configuration
    const getDebtTypeBadge = () => {
      switch (debtType) {
        case "one-time":
          return { label: "No Interest", className: "bg-gray-500", icon: "💳" };
        case "interest-push":
          return { label: "Interest-Push", className: "bg-orange-500", icon: "📈" };
        case "amortizing":
          return { label: "Amortizing", className: "bg-blue-500", icon: "🏦" };
        default:
          return { label: "One-Time", className: "bg-gray-500", icon: "💳" };
      }
    };

    const debtTypeBadge = getDebtTypeBadge();

    return (
      <div
        key={item.id}
        className="flex items-center justify-between p-3 border rounded-lg"
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Index badge */}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            #{index + 1}
          </Badge>

          <div className="flex-1 space-y-0.5">
            {/* Main line: Amount first, then name + other badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Compact balance - SHOWN FIRST */}
              <Badge
                variant="default"
                className="text-xs px-2 py-0.5 font-bold bg-primary"
              >
                {formatCompactAmount(item.currentBalance)}
              </Badge>

              <span className="font-semibold text-sm">{item.name}</span>

              {/* Debt Type Badge */}
              <Badge
                variant="default"
                className={`text-[10px] px-1.5 py-0 ${debtTypeBadge.className}`}
              >
                {debtTypeBadge.icon} {debtTypeBadge.label}
              </Badge>

              {/* Payment amount - varies by debt type */}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                📅 {formatCompactAmount(paymentDisplay.amount)}{paymentDisplay.isMonthly ? "/mo" : ""}
              </Badge>

              {/* APR badge (if exists) */}
              {item.interestRate && item.interestRate > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {item.interestRate}% APR
                </Badge>
              )}

              {/* Compounding frequency (for interest debts) */}
              {item.compoundingFrequency && debtType !== "one-time" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {item.compoundingFrequency}
                </Badge>
              )}

              {/* Paid off badge */}
              {isPaidOff && (
                <Badge
                  variant="default"
                  className="bg-green-500 text-[10px] px-1.5 py-0"
                >
                  ✓ Paid
                </Badge>
              )}
            </div>

            {/* Metadata line: due date + progress */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {dueDateDisplay && (
                <span>{dueDateDisplay.label}: {dueDateDisplay.text}</span>
              )}

              {payoffMonths && !isPaidOff && debtType !== "one-time" && (
                <>
                  <span>•</span>
                  <span>{payoffMonths}mo left</span>
                </>
              )}

              {(dueDateDisplay || (payoffMonths && !isPaidOff && debtType !== "one-time")) && <span>•</span>}
              <span>{progress.toFixed(0)}% paid</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          {actions.onEdit && (
            <button
              onClick={actions.onEdit}
              className="p-2 hover:bg-accent rounded"
              aria-label="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )}
          {actions.onDelete && (
            <button
              onClick={actions.onDelete}
              className="p-2 hover:bg-destructive/10 text-destructive rounded"
              aria-label="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  },

  // Actions
  actions: {
    edit: async (item: DebtWithUser) => {
      onEdit(item);
    },
    delete: async (id: string) => {
      await db.transact(db.tx.debts[id].delete());
    },
  },

  // Data transformation
  getItemId: (item: DebtWithUser) => item.id,

  // Custom filter
  customFilter: (
    item: DebtWithUser,
    searchQuery: string,
    filters: Record<string, string>
  ) => {
    // Apply status filter
    const statusFilter = filters.status;
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active" && item.currentBalance === 0) return false;
      if (statusFilter === "paid" && item.currentBalance > 0) return false;
      if (statusFilter === "due-today" && !isDueToday(item)) return false;
    }

    // Apply search
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  },

  // Custom sort
  customSort: (a: DebtWithUser, b: DebtWithUser, sortBy: string) => {
    switch (sortBy) {
      case "balance-desc":
        return b.currentBalance - a.currentBalance;
      case "balance-asc":
        return a.currentBalance - b.currentBalance;
      case "progress-desc": {
        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);
        return progressB - progressA;
      }
      case "due-day-asc":
        return a.paymentDueDay - b.paymentDueDay;
      case "deadline-asc":
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      default:
        return b.currentBalance - a.currentBalance;
    }
  },
});
