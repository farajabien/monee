/**
 * Income Source List Configuration
 *
 * Defines how income sources are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { IncomeSourceWithUser } from "@/types";
import { Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompactItemCard } from "@/components/ui/compact-item-card";
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


  // Rendering Functions
  renderListItem: (item: IncomeSourceWithUser, index: number, actions) => {
    const isActive = item.isActive !== false;
    const paydayText = formatPayday(item.paydayDay, item.paydayMonth);

    return (
      <CompactItemCard
        key={item.id}
        index={index}
        title={item.name}
        amount={formatAmount(item.amount)}
        amountColor="success"
        category={item.frequency}
        date={`Day ${item.paydayDay}`}
        secondaryInfo={paydayText}
        customBadge={
          !isActive
            ? {
                label: "Inactive",
                variant: "outline",
              }
            : undefined
        }
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
        }}
      />
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
