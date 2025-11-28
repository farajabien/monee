/**
 * Budget List Configuration
 *
 * Defines how budgets are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { BudgetWithRelations } from "@/types";
import { StandardListItem } from "@/components/ui/standard-list-item";
import { StandardGridCard } from "@/components/ui/standard-grid-card";
import { DollarSign, Calendar } from "lucide-react";
import db from "@/lib/db";

// Helper functions
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatMonthYear = (month: number, year: number) => {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
};

export const createBudgetListConfig = (currentMonth: number, currentYear: number): ListConfig<BudgetWithRelations> => ({
  // Identity
  queryKey: "budgets",

  // Display
  title: `Budgets for ${formatMonthYear(currentMonth, currentYear)}`,
  description: "Track and manage your monthly budgets",
  emptyMessage: "No budgets set for this month. Create a budget to track your spending goals.",
  emptyMessageFiltered: "No budgets found matching your search",
  searchPlaceholder: "Search budgets...",

  // Filters & Sort
  sortOptions: [
    { value: "amount-desc", label: "Amount: High to Low" },
    { value: "amount-asc", label: "Amount: Low to High" },
    { value: "category-asc", label: "Category (A-Z)" },
  ],
  defaultSort: "amount-desc",

  // Metrics (none for budgets as they're shown in header)
  metrics: [],

  // Views
  availableViews: ["list", "grid"],
  defaultView: "grid",

  // Rendering Functions
  renderListItem: (item: BudgetWithRelations, index: number, actions) => {
    return (
      <StandardListItem
        key={item.id}
        title={item.category?.name || "Unknown Category"}
        subtitle={formatMonthYear(item.month, item.year)}
        badge={{
          label: `#${index + 1}`,
          variant: "outline",
        }}
        metadata={[
          {
            label: "Amount",
            value: formatAmount(item.amount),
            icon: DollarSign,
          },
        ]}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
      />
    );
  },

  renderGridCard: (item: BudgetWithRelations, index: number, actions) => {
    return (
      <StandardGridCard
        key={item.id}
        title={item.category?.name || "Unknown Category"}
        badge={{
          label: `#${index + 1}`,
          variant: "outline",
        }}
        mainValue={formatAmount(item.amount)}
        subtitle={formatMonthYear(item.month, item.year)}
        metadata={[
          {
            label: "Month",
            value: formatMonthYear(item.month, item.year),
            icon: Calendar,
          },
        ]}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
      />
    );
  },

  // Actions
  actions: {
    edit: async (item: BudgetWithRelations) => {
      // Handled by parent component
    },
    delete: async (id: string) => {
      if (confirm("Are you sure you want to delete this budget?")) {
        await db.transact(db.tx.budgets[id].delete());
      }
    },
  },

  // Data transformation
  getItemId: (item: BudgetWithRelations) => item.id,

  // Custom filter
  customFilter: (item: BudgetWithRelations, searchQuery: string) => {
    if (searchQuery) {
      return (item.category?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    }
    return true;
  },

  // Custom sort
  customSort: (a: BudgetWithRelations, b: BudgetWithRelations, sortBy: string) => {
    switch (sortBy) {
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "category-asc":
        return (a.category?.name || "").localeCompare(b.category?.name || "");
      default:
        return b.amount - a.amount;
    }
  },
});
