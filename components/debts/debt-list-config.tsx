/**
 * Debt List Configuration
 *
 * Defines how debts are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { DebtWithUser } from "@/types";
import {
  TrendingDown,
  Clock,
  Calendar,
  Percent,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { CompactItemCard } from "@/components/ui/compact-item-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import db from "@/lib/db";
import { formatCurrency } from "@/lib/currency-utils";

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

const formatDateCompact = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
};

const calculateProgress = (debt: DebtWithUser) => {
  if (debt.debtTaken === 0) return 100;
  const paid = (debt.debtTaken || 0) - debt.currentBalance;
  return (paid / (debt.debtTaken || 0)) * 100;
};

const calculatePayoffMonths = (debt: DebtWithUser) => {
  if (debt.monthlyPaymentAmount === 0) return null;
  return Math.ceil(debt.currentBalance / (debt.monthlyPaymentAmount || 0));
};

const isDueToday = (debt: DebtWithUser) => {
  if (!debt.nextPaymentDueDate) return false;
  const today = new Date();
  const dueDate = new Date(debt.nextPaymentDueDate);
  return (
    today.getDate() === dueDate.getDate() &&
    today.getMonth() === dueDate.getMonth() &&
    today.getFullYear() === dueDate.getFullYear()
  );
};

const calculateRemainingDays = (debt: DebtWithUser) => {
  if (!debt.nextPaymentDueDate) return null;
  const today = new Date();
  const dueDate = new Date(debt.nextPaymentDueDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Format interest terms display
const formatInterestTerms = (debt: DebtWithUser) => {
  if (!debt.interestRate || debt.interestRate === 0) {
    return "N/A";
  }
  const frequency = debt.interestFrequency || "per month";
  return `${debt.interestRate}% ${frequency}`;
};

// Format repayment terms display
const formatRepaymentTerms = (debt: DebtWithUser) => {
  const terms = debt.repaymentTerms || "One-time";
  return terms;
};

// Calculate the appropriate payment amount to display based on debt type
const getPaymentDisplay = (debt: DebtWithUser) => {
  const repaymentTerms = debt.repaymentTerms || "One-time";

  if (repaymentTerms === "One-time") {
    // One-time: show full amount due
    return {
      amount: debt.currentBalance,
      label: "Due",
      isMonthly: false,
    };
  } else if (repaymentTerms === "Interest Push") {
    // Interest-push: show interest payment or full amount option
    const interestAmount = debt.nextPaymentAmount || 0;
    return {
      amount: interestAmount,
      label: "Interest or Full",
      isMonthly: false,
    };
  } else if (repaymentTerms === "No Interest") {
    // No interest: show full amount or flexible payment
    return {
      amount: debt.currentBalance,
      label: "Full or Reduce",
      isMonthly: false,
    };
  } else {
    // Amortizing: show monthly payment (principal + interest)
    return {
      amount: debt.monthlyPaymentAmount || debt.nextPaymentAmount || 0,
      label: "Payment/mo",
      isMonthly: true,
    };
  }
};

// Get due date display based on debt type
const getDueDateDisplay = (debt: DebtWithUser) => {
  if (debt.nextPaymentDueDate) {
    return {
      text: formatDate(debt.nextPaymentDueDate),
      label: "Next payment",
    };
  } else if (debt.deadline) {
    return {
      text: formatDate(debt.deadline),
      label: "Deadline",
    };
  } else if (debt.paymentDueDay && debt.paymentDueDay > 0) {
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
  onEdit: (debt: DebtWithUser) => void,
  onViewDetails: (debt: DebtWithUser) => void
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
    {
      key: "repaymentTerms",
      label: "Repayment Terms",
      type: "select",
      options: [
        { value: "Interest Push", label: "Interest Push" },
        { value: "No Interest", label: "No Interest" },
        { value: "Amortizing", label: "Amortizing" },
        { value: "One-time", label: "One-time" },
      ],
    },
  ] as FilterConfig[],

  sortOptions: [
    { value: "balance-desc", label: "Balance (High to Low)" },
    { value: "balance-asc", label: "Balance (Low to High)" },
    { value: "progress-desc", label: "Progress" },
    { value: "due-date-asc", label: "Due Date (Soonest)" },
    { value: "remaining-days-asc", label: "Remaining Days" },
  ],
  defaultSort: "balance-desc",
  searchFields: ["debtor"],

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
      (sum, debt) => sum + (debt.debtTaken || 0),
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
  availableViews: ["list", "table"],
  defaultView: "list",

  // Table columns
  tableColumns: [
    {
      accessorKey: "debtor",
      header: "Debtor",
      cell: ({ row }) => {
        return (
          <div className="font-medium">{row.original.debtor || "Unknown"}</div>
        );
      },
    },
    {
      accessorKey: "debtTaken",
      header: () => <div className="text-right">Debt Taken</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right text-sm">
            {formatCompactAmount(row.original.debtTaken || 0)}
          </div>
        );
      },
    },
    {
      id: "interestTerms",
      header: "Interest Terms",
      cell: ({ row }) => {
        return (
          <div className="text-sm">{formatInterestTerms(row.original)}</div>
        );
      },
    },
    {
      accessorKey: "repaymentTerms",
      header: "Repayment Terms",
      cell: ({ row }) => {
        const terms = formatRepaymentTerms(row.original);
        return (
          <Badge variant="outline" className="text-xs">
            {terms}
          </Badge>
        );
      },
    },
    {
      accessorKey: "nextPaymentAmount",
      header: () => <div className="text-right">Next Payment</div>,
      cell: ({ row }) => {
        const paymentDisplay = getPaymentDisplay(row.original);
        return (
          <div className="text-right">
            <div className="font-semibold text-red-600 dark:text-red-400">
              {formatCompactAmount(paymentDisplay.amount)}
            </div>
            <div className="text-xs text-muted-foreground">
              {paymentDisplay.label}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "nextPaymentDueDate",
      header: "Next Due Date",
      cell: ({ row }) => {
        const dueDateDisplay = getDueDateDisplay(row.original);
        if (!dueDateDisplay)
          return <span className="text-muted-foreground">-</span>;
        return <div className="text-sm">{dueDateDisplay.text}</div>;
      },
    },
    {
      id: "remainingDays",
      header: () => <div className="text-center">Days Left</div>,
      cell: ({ row }) => {
        const remainingDays = calculateRemainingDays(row.original);
        if (remainingDays === null)
          return <span className="text-muted-foreground">-</span>;

        const isOverdue = remainingDays < 0;
        const isDueSoon = remainingDays >= 0 && remainingDays <= 7;

        return (
          <div className="text-center">
            <Badge
              variant={
                isOverdue ? "destructive" : isDueSoon ? "default" : "outline"
              }
              className="text-xs"
            >
              {isOverdue
                ? `${Math.abs(remainingDays)}d overdue`
                : `${remainingDays}d`}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "currentBalance",
      header: () => <div className="text-right">Balance</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold text-red-600 dark:text-red-400">
            {formatCompactAmount(row.original.currentBalance)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row, table }) => {
        const debt = row.original;
        const meta = table.options.meta as {
          onEdit?: (item: DebtWithUser) => void;
          onDelete?: (id: string) => void;
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {meta?.onEdit && (
                <DropdownMenuItem onClick={() => meta.onEdit!(debt)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {meta?.onDelete && (
                <DropdownMenuItem
                  onClick={() => meta.onDelete!(debt.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ] as ColumnDef<DebtWithUser>[],

  // Rendering Functions
  renderListItem: (item: DebtWithUser, index: number, actions) => {
    const progress = calculateProgress(item);
    const isPaidOff = item.currentBalance === 0;
    const dueDateDisplay = getDueDateDisplay(item);
    const remainingDays = calculateRemainingDays(item);

    // Build secondary info string
    let secondaryInfo = `${progress.toFixed(0)}% paid`;

    // Add remaining days if available
    if (remainingDays !== null) {
      if (remainingDays < 0) {
        secondaryInfo += ` • ${Math.abs(remainingDays)}d overdue`;
      } else if (remainingDays === 0) {
        secondaryInfo += ` • Due today`;
      } else {
        secondaryInfo += ` • ${remainingDays}d left`;
      }
    }

    // Add due date info
    let dateText = "";
    if (dueDateDisplay) {
      dateText = dueDateDisplay.text;
    }

    return (
      <CompactItemCard
        key={item.id}
        index={index}
        title={item.debtor || "Unknown Debtor"}
        amount={formatCompactAmount(item.currentBalance)}
        amountColor={isPaidOff ? "success" : "primary"}
        category={formatRepaymentTerms(item)}
        date={dateText}
        secondaryInfo={secondaryInfo}
        isCompleted={isPaidOff}
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
          onPay:
            !isPaidOff && actions.customActions?.[0]
              ? () => actions.customActions![0].onClick(item)
              : undefined,
          onViewDetails: () => onViewDetails(item),
        }}
      />
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
    custom: [
      {
        label: "Record Payment",
        onClick: (item: DebtWithUser) => onRecordPayment(item),
        condition: (item: DebtWithUser) => item.currentBalance > 0,
      },
    ],
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

    // Apply repayment terms filter
    const repaymentTermsFilter = filters.repaymentTerms;
    if (repaymentTermsFilter && repaymentTermsFilter !== "all") {
      if (item.repaymentTerms !== repaymentTermsFilter) return false;
    }

    // Apply search
    if (searchQuery) {
      const debtor = item.debtor || "";
      return debtor.toLowerCase().includes(searchQuery.toLowerCase());
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
      case "due-date-asc": {
        if (!a.nextPaymentDueDate && !b.nextPaymentDueDate) return 0;
        if (!a.nextPaymentDueDate) return 1;
        if (!b.nextPaymentDueDate) return -1;
        return a.nextPaymentDueDate - b.nextPaymentDueDate;
      }
      case "remaining-days-asc": {
        const daysA = calculateRemainingDays(a);
        const daysB = calculateRemainingDays(b);
        if (daysA === null && daysB === null) return 0;
        if (daysA === null) return 1;
        if (daysB === null) return -1;
        return daysA - daysB;
      }
      default:
        return b.currentBalance - a.currentBalance;
    }
  },
});
