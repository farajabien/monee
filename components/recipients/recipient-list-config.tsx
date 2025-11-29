/**
 * Recipient List Configuration
 *
 * Defines how recipients are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Receipt, Settings } from "lucide-react";

export type RecipientWithStats = {
  id: string;
  originalName: string;
  nickname?: string;
  defaultCategory?: string;
  notes?: string;
  updatedAt: number;
  totalAmount: number;
  expenseCount: number;
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const createRecipientListConfig = (
  onManage: (recipient: RecipientWithStats) => void
): ListConfig<RecipientWithStats> => ({
  // Identity
  queryKey: "recipients",

  // Display
  title: "Recipients",
  description: "Track where your money goes",
  emptyMessage: "No recipients yet. Recipients will appear as you add expenses.",
  emptyMessageFiltered: "No recipients found matching your filters",
  searchPlaceholder: "Search recipients...",

  // Filters & Sort
  filters: [
    {
      key: "hasNickname",
      label: "Nickname",
      type: "select",
      options: [
        { value: "yes", label: "Has Nickname" },
        { value: "no", label: "No Nickname" },
      ],
    },
    {
      key: "hasCategory",
      label: "Category",
      type: "select",
      options: [
        { value: "yes", label: "Has Category" },
        { value: "no", label: "No Category" },
      ],
    },
  ] as FilterConfig[],

  sortOptions: [
    { value: "amount-high", label: "Amount (High to Low)" },
    { value: "amount-low", label: "Amount (Low to High)" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "recent", label: "Recently Updated" },
    { value: "count-high", label: "Most Expenses" },
  ],
  defaultSort: "amount-high",
  searchFields: ["originalName", "nickname", "defaultCategory", "notes"],

  // Metrics
  metrics: [
    {
      key: "totalRecipients",
      label: "Recipients",
      type: "count",
      icon: Users,
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      type: "currency",
      icon: "💰",
    },
    {
      key: "avgPerRecipient",
      label: "Avg/Recipient",
      type: "currency",
      icon: "💰",
    },
  ],

  calculateMetrics: (items: RecipientWithStats[]) => {
    const totalSpent = items.reduce((sum, r) => sum + r.totalAmount, 0);
    const avgPerRecipient = items.length > 0 ? totalSpent / items.length : 0;

    return {
      totalRecipients: items.length,
      totalSpent,
      avgPerRecipient,
    };
  },

  // Views
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (item: RecipientWithStats, index: number, actions) => {
    const displayName = item.nickname || item.originalName;
    const hasNickname = !!item.nickname;

    return (
      <div
        key={item.id}
        className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
      >
        {/* Icon/Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base truncate">
              {displayName}
            </span>
            {hasNickname && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Nicknamed
              </Badge>
            )}
          </div>

          {/* Original name if different */}
          {hasNickname && (
            <p className="text-xs text-muted-foreground truncate">
              {item.originalName}
            </p>
          )}

          {/* Category */}
          {item.defaultCategory && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {item.defaultCategory}
              </Badge>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <span>💰</span>
              <span className="font-semibold text-foreground">
                {formatAmount(item.totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              <span>{item.expenseCount} expenses</span>
            </div>
          </div>
        </div>

        {/* Manage button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onManage(item)}
          className="shrink-0"
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Manage
        </Button>
      </div>
    );
  },

  // Actions
  actions: {
    edit: async (item: RecipientWithStats) => {
      // Handled via manage button / onManage callback
    },
    delete: async (id: string) => {
      // Recipients are not directly deleted - they're derived from expenses
      // Instead, we could clear nickname/category settings
    },
  },

  // Data transformation
  getItemId: (item: RecipientWithStats) => item.id,

  // Custom filter
  customFilter: (item: RecipientWithStats, searchQuery: string, filters: Record<string, any>): boolean => {
    // Apply nickname filter
    const nicknameFilter = filters.hasNickname;
    if (nicknameFilter && nicknameFilter !== "all") {
      const hasNickname = !!item.nickname;
      if (nicknameFilter === "yes" && !hasNickname) return false;
      if (nicknameFilter === "no" && hasNickname) return false;
    }

    // Apply category filter
    const categoryFilter = filters.hasCategory;
    if (categoryFilter && categoryFilter !== "all") {
      const hasCategory = !!item.defaultCategory;
      if (categoryFilter === "yes" && !hasCategory) return false;
      if (categoryFilter === "no" && hasCategory) return false;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const displayName = item.nickname || item.originalName;
      return (
        displayName.toLowerCase().includes(query) ||
        item.originalName.toLowerCase().includes(query) ||
        (item.defaultCategory?.toLowerCase().includes(query) ?? false) ||
        (item.notes?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  },

  // Custom sort
  customSort: (a: RecipientWithStats, b: RecipientWithStats, sortBy: string) => {
    switch (sortBy) {
      case "amount-high":
        return b.totalAmount - a.totalAmount;
      case "amount-low":
        return a.totalAmount - b.totalAmount;
      case "name-asc": {
        const nameA = a.nickname || a.originalName;
        const nameB = b.nickname || b.originalName;
        return nameA.localeCompare(nameB);
      }
      case "name-desc": {
        const nameA = a.nickname || a.originalName;
        const nameB = b.nickname || b.originalName;
        return nameB.localeCompare(nameA);
      }
      case "recent":
        return b.updatedAt - a.updatedAt;
      case "count-high":
        return b.expenseCount - a.expenseCount;
      default:
        return b.totalAmount - a.totalAmount;
    }
  },
});
