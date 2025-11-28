/**
 * Debt List Configuration
 *
 * Defines how debts are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { DebtWithUser } from "@/types";
import { StandardListItem } from "@/components/ui/standard-list-item";
import { StandardGridCard } from "@/components/ui/standard-grid-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, CheckCircle, Clock, Calendar, ArrowRight } from "lucide-react";
import db from "@/lib/db";

// Helper functions
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
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

export const createDebtListConfig = (
  onRecordPayment: (debt: DebtWithUser) => void,
  onQuickPush: (debt: DebtWithUser) => void
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
      icon: DollarSign,
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
      icon: CheckCircle,
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
    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalOriginal = activeDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalPaid = totalOriginal - totalDebt;
    const avgProgress =
      activeDebts.length > 0
        ? activeDebts.reduce((sum, d) => sum + calculateProgress(d), 0) / activeDebts.length
        : 0;

    return {
      totalDebt,
      activeCount: activeDebts.length,
      totalPaid,
      avgProgress,
    };
  },

  // Views
  availableViews: ["list", "grid"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: DebtWithUser, index: number, actions) => {
    const progress = calculateProgress(item);
    const payoffMonths = calculatePayoffMonths(item);
    const isPaidOff = item.currentBalance === 0;
    const dueToday = isDueToday(item);

    const badges = [];
    if (item.interestRate) {
      badges.push({
        label: `${item.interestRate}% APR`,
        variant: "secondary" as const,
      });
    }
    if (item.pushMonthsPlan) {
      badges.push({
        label: `Push: ${item.pushMonthsCompleted || 0}/${item.pushMonthsPlan}`,
        variant: "outline" as const,
      });
    }

    return (
      <div key={item.id} className="space-y-3 border rounded-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              #{index + 1}
            </Badge>
            <span className="font-semibold text-base">{item.name}</span>
            {isPaidOff && (
              <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid Off
              </Badge>
            )}
            {badges.map((badge, idx) => (
              <Badge
                key={idx}
                variant={badge.variant}
                className="text-xs px-2 py-0.5"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1">
            {actions.onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={actions.onEdit}>
                <Calendar className="h-4 w-4" />
              </Button>
            )}
            {actions.onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={actions.onDelete}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatAmount(item.currentBalance)} of {formatAmount(item.totalAmount)}
            </span>
            <span className="font-semibold">
              {formatAmount(item.monthlyPaymentAmount)}/month
            </span>
          </div>
          <StandardGridCard
            title=""
            progress={{
              value: progress,
              label: `${progress.toFixed(1)}% paid off`,
              showPercentage: false,
            }}
            className="border-0 shadow-none p-0"
            contentClassName="p-0"
          />
          {payoffMonths && !isPaidOff && (
            <div className="text-xs text-muted-foreground text-right">
              {payoffMonths} months remaining
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Due day {item.paymentDueDay}</span>
          </div>
          {item.deadline && <span>Deadline: {formatDate(item.deadline)}</span>}
          {item.interestAccrued && item.interestAccrued > 0 && (
            <span className="text-amber-600 font-medium">
              Interest: {formatAmount(item.interestAccrued)}
            </span>
          )}
        </div>

        {/* Actions for due today */}
        {dueToday && !isPaidOff && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => onRecordPayment(item)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            {item.interestRate && item.interestRate > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickPush(item)}
                className="flex-1"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Push to Next Month
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },

  renderGridCard: (item: DebtWithUser, index: number, actions) => {
    const progress = calculateProgress(item);
    const payoffMonths = calculatePayoffMonths(item);
    const isPaidOff = item.currentBalance === 0;
    const dueToday = isDueToday(item);

    const footerContent = dueToday && !isPaidOff && (
      <div className="flex gap-1.5 w-full">
        <Button
          variant="default"
          size="sm"
          onClick={() => onRecordPayment(item)}
          className="flex-1 h-8 text-xs"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Button>
        {item.interestRate && item.interestRate > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickPush(item)}
            className="flex-1 h-8 text-xs"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Push
          </Button>
        )}
      </div>
    );

    return (
      <StandardGridCard
        key={item.id}
        title={item.name}
        badge={{
          label: `#${index + 1}`,
          variant: "outline",
        }}
        statusBadge={
          isPaidOff
            ? { label: "Paid Off", variant: "default", className: "bg-green-500" }
            : undefined
        }
        mainValue={formatAmount(item.currentBalance)}
        subtitle={`${formatAmount(item.monthlyPaymentAmount)}/month`}
        progress={{
          value: progress,
          label: `${progress.toFixed(0)}% paid off`,
          showPercentage: false,
        }}
        metadata={[
          {
            label: "Due Day",
            value: item.paymentDueDay.toString(),
            icon: Calendar,
          },
          ...(payoffMonths && !isPaidOff
            ? [{ label: "Payoff", value: `${payoffMonths} months` }]
            : []),
          ...(item.deadline
            ? [{ label: "Deadline", value: formatDate(item.deadline) }]
            : []),
          ...(item.interestRate
            ? [{ label: "APR", value: `${item.interestRate}%` }]
            : []),
        ]}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
        footerContent={footerContent}
      />
    );
  },

  // Actions
  actions: {
    edit: async (item: DebtWithUser) => {
      // Handled by parent component via editDialog prop
    },
    delete: async (id: string) => {
      await db.transact(db.tx.debts[id].delete());
    },
  },

  // Data transformation
  getItemId: (item: DebtWithUser) => item.id,

  // Custom filter
  customFilter: (item: DebtWithUser, searchQuery: string, filters: any) => {
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
