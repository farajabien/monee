/**
 * Expense List Configuration
 *
 * Defines how expenses are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { Expense } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
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

const getDisplayName = (originalName: string, recipients: any[]) => {
  const recipient = recipients.find((r) => r.originalName === originalName);
  return recipient?.nickname || originalName;
};

export const createExpenseListConfig = (
  recipients: any[],
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
      key: "expenseCount",
      label: "Transactions",
      type: "count",
      icon: Calendar,
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
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: Expense, index: number, actions) => {
    const displayName = getDisplayName(item.recipient || "", recipients);

    return (
      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{displayName || "Unknown"}</span>
              <Badge variant="secondary">{formatAmount(item.amount)}</Badge>
              {item.category && (
                <Badge variant="outline">{item.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(item.date || item.createdAt)}</span>
            </div>
          </div>
        </div>
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
