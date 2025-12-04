/**
 * Income Source List Configuration
 *
 * Defines how income sources are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { IncomeSourceWithUser } from "@/types";
import { Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import db from "@/lib/db";

// Helper functions
const formatPayday = (paydayDay: number, paydayMonth?: number) => {
  if (paydayMonth) {
    const monthName = new Date(2000, paydayMonth - 1).toLocaleString("default", {
      month: "long",
    });
    return `${monthName} ${paydayDay}`;
  }
  return `Day ${paydayDay} of each month`;
};

export const createIncomeSourceListConfig = (
  formatAmount: (amount: number) => string
): ListConfig<IncomeSourceWithUser> => ({
  // Identity
  queryKey: "income_sources",

  // Display
  title: "Income Sources",
  description: "Track and manage your income sources",
  emptyMessage: "No income sources added yet. Add your income sources to track your earnings.",
  emptyMessageFiltered: "No income sources found matching your filters",
  searchPlaceholder: "Search income sources...",

  // Filters & Sort
  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ] as FilterConfig[],

  sortOptions: [
    { value: "amount-desc", label: "Amount: High to Low" },
    { value: "amount-asc", label: "Amount: Low to High" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "payday-asc", label: "Payday" },
  ],
  defaultSort: "amount-desc",
  searchFields: ["name"],

  // Metrics
  metrics: [
    {
      key: "totalAmount",
      label: "Total Income",
      type: "currency",
      icon: "💰",
    },
    {
      key: "activeCount",
      label: "Active",
      type: "count",
      icon: TrendingUp,
    },
    {
      key: "inactiveCount",
      label: "Inactive",
      type: "count",
      icon: CheckCircle,
    },
  ],

  calculateMetrics: (items: IncomeSourceWithUser[]) => {
    const active = items.filter((s) => s.isActive !== false);
    const inactive = items.filter((s) => s.isActive === false);
    const totalAmount = active.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalAmount,
      activeCount: active.length,
      inactiveCount: inactive.length,
    };
  },

  // Views
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: IncomeSourceWithUser, index: number, actions) => {
    return (
      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.name}</span>
              <Badge variant="secondary">{formatAmount(item.amount)}</Badge>
              {!item.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatPayday(item.paydayDay, item.paydayMonth)}</span>
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
    edit: async (item: IncomeSourceWithUser) => {
      // Handled by parent component via dialog
    },
    delete: async (id: string) => {
      if (confirm("Are you sure you want to delete this income source?")) {
        await db.transact(db.tx.income_sources[id].delete());
      }
    },
  },

  // Data transformation
  getItemId: (item: IncomeSourceWithUser) => item.id,

  // Custom filter
  customFilter: (item: IncomeSourceWithUser, searchQuery: string, filters: any) => {
    // Apply status filter
    const statusFilter = filters.status;
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active" && item.isActive === false) return false;
      if (statusFilter === "inactive" && item.isActive !== false) return false;
    }

    // Apply search
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  },

  // Custom sort
  customSort: (a: IncomeSourceWithUser, b: IncomeSourceWithUser, sortBy: string) => {
    switch (sortBy) {
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "payday-asc":
        return a.paydayDay - b.paydayDay;
      default:
        return b.amount - a.amount;
    }
  },
});
