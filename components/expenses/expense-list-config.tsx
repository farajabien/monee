/**
 * Expense List Configuration
 *
 * Defines how expenses are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { Expense, Recipient } from "@/types";
import { Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { UnifiedItemCard } from "@/components/ui/unified-item-card";
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
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDisplayName = (originalName: string, recipients: Recipient[]) => {
  const recipient = recipients.find((r) => r.originalName === originalName);
  return recipient?.nickname || originalName;
};

export const createExpenseListConfig = (
  recipients: Recipient[],
  formatAmount: (amount: number) => string
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

  // Views
  availableViews: ["list", "table"],
  defaultView: "list",

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
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "recipient",
      header: "Recipient",
      cell: ({ row }) => {
        const displayName = getDisplayName(row.original.recipient || "", recipients);
        return <div className="font-medium">{displayName}</div>;
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
      id: "actions",
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

    return (
      <UnifiedItemCard
        key={item.id}
        index={index}
        primaryBadge={{
          value: formatAmount(item.amount),
          variant: "destructive",
          icon: "💸",
          className: "text-xs px-2 py-0.5 font-semibold bg-destructive text-destructive-foreground",
        }}
        title={displayName || "Unknown"}
        badges={
          item.category
            ? [{ label: item.category, variant: "outline" as const }]
            : []
        }
        metadata={[
          {
            icon: <Calendar className="h-3.5 w-3.5" />,
            text: formatDate(item.date || item.createdAt),
          },
        ]}
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
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
