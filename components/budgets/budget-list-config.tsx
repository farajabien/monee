/**
 * Budget List Configuration
 *
 * Defines how budgets are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { BudgetWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
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
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: BudgetWithRelations, index: number, actions) => {
    return (
      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.category?.name || "Unknown Category"}</span>
              <Badge variant="secondary">{formatAmount(item.amount)}</Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatMonthYear(item.month, item.year)}</span>
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
              <DollarSign className="h-4 w-4" />
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
