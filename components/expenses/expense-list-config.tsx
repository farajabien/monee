/**
 * Expense List Configuration
 *
 * Defines how expenses are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { Expense, Recipient } from "@/types";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Calendar,
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

// Helper functions

const formatDateCompact = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if same day
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // Show month and day only if same year
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
    });
  }

  // Show full date if different year
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const getDisplayName = (originalName: string, recipients: Recipient[]) => {
  const recipient = recipients.find((r) => r.originalName === originalName);
  return recipient?.nickname || originalName;
};

export const createExpenseListConfig = (
  recipients: Recipient[],
  formatAmount: (amount: number) => string,
  checkPaidStatus?: (expenseId: string) => boolean
): ListConfig<Expense> => ({
  // Identity
  queryKey: "expenses",

  // Display
  title: "Expenses",
  description: "Track and manage your expenses",
  emptyMessage: "No expenses yet. Add your first Mpesa message above",
  emptyMessageFiltered: "No expenses found matching your filters",
  searchPlaceholder: "Search expenses...",

  // Filters & Sort
  sortOptions: [
    { value: "date-desc", label: "Newest" },
    { value: "date-asc", label: "Oldest" },
    { value: "amount-desc", label: "Amount ↓" },
    { value: "amount-asc", label: "Amount ↑" },
  ],
  defaultSort: "date-desc",
  searchFields: ["recipient", "category"],

  // Metrics
  metrics: [
    {
      key: "totalSpent",
      label: "Total",
      type: "currency",
      icon: "💰",
    },

    {
      key: "avgExpense",
      label: "Avg",
      type: "currency",
      icon: "💰",
    },
  ],

  calculateMetrics: (items: Expense[]) => {
    const totalSpent = items.reduce((sum, t) => sum + t.amount, 0);
    const expenseCount = items.length;
    const avgExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;

    return {
      totalSpent,
      expenseCount,
      avgExpense,
    };
  },


  // Table columns
  tableColumns: [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const timestamp = row.original.date || row.original.createdAt;
        return (
          <div className="text-sm">
            {new Date(timestamp).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "recipient",
      header: "Recipient",
      cell: ({ row }) => {
        const displayName = getDisplayName(
          row.original.recipient || "",
          recipients
        );
        const isRecurring =
          row.original.isRecurring || !!row.original.linkedRecurringId;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            {isRecurring && (
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        return row.original.category ? (
          <Badge variant="outline" className="text-xs">
            {row.original.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold text-red-600 dark:text-red-400">
            {formatAmount(row.original.amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "paidThisMonth",
      header: "Paid",
      cell: ({ row }) => {
        const isRecurring =
          row.original.isRecurring || !!row.original.linkedRecurringId;
        if (!isRecurring) return null;

        const recurringId = row.original.linkedRecurringId || row.original.id;
        const isPaidThisMonth = checkPaidStatus
          ? checkPaidStatus(recurringId)
          : false;

        return (
          <Badge variant={isPaidThisMonth ? "default" : "outline"}>
            {isPaidThisMonth ? "Yes" : "No"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row, table }) => {
        const expense = row.original;
        const meta = table.options.meta as {
          onEdit?: (item: Expense) => void;
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
                <DropdownMenuItem onClick={() => meta.onEdit!(expense)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {meta?.onDelete && (
                <DropdownMenuItem
                  onClick={() => meta.onDelete!(expense.id)}
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
  ] as ColumnDef<Expense>[],

  // Rendering Functions
  renderListItem: (item: Expense, index: number, actions) => {
    const displayName = getDisplayName(item.recipient || "", recipients);
    const isRecurring = item.isRecurring || !!item.linkedRecurringId;

    // Check if this recurring expense has been paid this month
    const recurringId = item.linkedRecurringId || item.id;
    const isPaidThisMonth =
      isRecurring && checkPaidStatus ? checkPaidStatus(recurringId) : false;

    return (
      <CompactItemCard
        key={item.id}
        index={index}
        title={displayName || "Unknown"}
        amount={formatAmount(item.amount)}
        amountColor="destructive"
        category={item.category}
        date={formatDateCompact(item.date || item.createdAt)}
        isRecurring={isRecurring}
        isPaid={isPaidThisMonth}
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
          onPay:
            isRecurring && !isPaidThisMonth
              ? () => actions.customActions?.[0]?.onClick(item)
              : undefined,
        }}
      />
    );
  },

  // Actions
  actions: {
    edit: async () => {
      // Handled by parent component via editDialog prop
    },
    delete: async (id: string) => {
      await db.transact(db.tx.expenses[id].delete());
    },
    custom: [
      {
        label: "Record Payment",
        onClick: async (item: Expense) => {
          // This will be handled in expense-list.tsx with proper payment dialog
          console.log("Record payment for recurring expense:", item.id);
        },
      },
    ],
  },

  // Data transformation
  getItemId: (item: Expense) => item.id,

  // Custom sort
  customSort: (a: Expense, b: Expense, sortBy: string) => {
    switch (sortBy) {
      case "date-desc":
        return (b.date || b.createdAt) - (a.date || a.createdAt);
      case "date-asc":
        return (a.date || a.createdAt) - (b.date || b.createdAt);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      default:
        return (b.date || b.createdAt) - (a.date || a.createdAt);
    }
  },

  // Custom filter
  customFilter: (item: Expense, searchQuery: string) => {
    const displayName = getDisplayName(item.recipient || "", recipients);
    const searchLower = searchQuery.toLowerCase();

    return (
      displayName.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      formatAmount(item.amount).toLowerCase().includes(searchLower)
    );
  },
});
