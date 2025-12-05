/**
 * Debt List Configuration
 *
 * Defines how debts are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { DebtWithUser } from "@/types";
import { TrendingDown, Clock, Calendar, Percent, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  availableViews: ["list", "table"],
  defaultView: "list",

  // Table columns
  tableColumns: [
    {
      accessorKey: "name",
      header: "Debt Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.name}</div>;
      },
    },
    {
      accessorKey: "debtType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.debtType || "one-time";
        const icon = type === "credit-card" ? "💳" : type === "loan" ? "📈" : "🏦";
        return (
          <Badge variant="outline" className="text-xs">
            {icon} {type.replace("-", " ")}
          </Badge>
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
      accessorKey: "monthlyPaymentAmount",
      header: () => <div className="text-right">Monthly Payment</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right text-sm">
            {formatCompactAmount(row.original.monthlyPaymentAmount || 0)}
          </div>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = calculateProgress(row.original);
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
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

    // Build secondary info string
    let secondaryInfo = `${progress.toFixed(0)}% paid`;

    // Add due date info
    let dateText = "";
    if (dueDateDisplay) {
      dateText = dueDateDisplay.text;
    }

    return (
      <CompactItemCard
        key={item.id}
        index={index}
        title={item.name}
        amount={formatCompactAmount(item.currentBalance)}
        amountColor={isPaidOff ? "success" : "primary"}
        category={`${progress.toFixed(0)}% paid`}
        date={dateText}
        secondaryInfo={secondaryInfo}
        isCompleted={isPaidOff}
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
          onPay: !isPaidOff && actions.customActions?.[0]
            ? () => actions.customActions![0].onClick(item)
            : undefined,
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
