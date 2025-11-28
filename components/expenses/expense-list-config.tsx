/**
 * Expense List Configuration
 *
 * Defines how expenses are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { Expense } from "@/types";
import { StandardListItem } from "@/components/ui/standard-list-item";
import { StandardGridCard } from "@/components/ui/standard-grid-card";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getDisplayName = (originalName: string, recipients: any[]) => {
  const recipient = recipients.find((r) => r.originalName === originalName);
  return recipient?.nickname || originalName;
};

export const createExpenseListConfig = (
  recipients: any[]
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
      icon: DollarSign,
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
      icon: TrendingUp,
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
  availableViews: ["list", "grid"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: Expense, index: number, actions) => {
    const displayName = getDisplayName(item.recipient || "", recipients);

    return (
      <StandardListItem
        key={item.id}
        title={formatAmount(item.amount)}
        subtitle={displayName ? `To: ${displayName}` : undefined}
        badge={{
          label: `#${index + 1}`,
          variant: "outline",
        }}
        metadata={[
          {
            label: "Date",
            value: formatDate(item.date || item.createdAt),
          },
          ...(item.category
            ? [
                {
                  label: "Category",
                  value: item.category,
                },
              ]
            : []),
        ]}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
      />
    );
  },

  renderGridCard: (item: Expense, index: number, actions) => {
    const displayName = getDisplayName(item.recipient || "", recipients);

    return (
      <StandardGridCard
        key={item.id}
        title={formatAmount(item.amount)}
        badge={{
          label: `#${index + 1}`,
          variant: "outline",
        }}
        subtitle={displayName ? `To: ${displayName}` : undefined}
        metadata={[
          {
            label: "Date",
            value: formatDate(item.date || item.createdAt),
          },
          ...(item.category
            ? [
                {
                  label: "Category",
                  value: item.category,
                },
              ]
            : []),
        ]}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
      />
    );
  },

  // Actions
  actions: {
    edit: async (item: Expense) => {
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
  customFilter: (item: Expense, searchQuery: string, filters: any) => {
    const displayName = getDisplayName(item.recipient || "", recipients);
    const searchLower = searchQuery.toLowerCase();

    return (
      displayName.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      formatAmount(item.amount).toLowerCase().includes(searchLower)
    );
  },
});
