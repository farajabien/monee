/**
 * Category List Configuration
 *
 * Defines how categories are displayed, filtered, and sorted
 */

import type { ListConfig, FilterConfig } from "@/types/list-config";
import type { Category } from "@/types";
import { StandardGridCard } from "@/components/ui/standard-grid-card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tag, ToggleLeft } from "lucide-react";
import db from "@/lib/db";
import { id } from "@instantdb/react";

// System default category names
const SYSTEM_CATEGORY_NAMES = new Set([
  "food",
  "transport",
  "housing",
  "utilities",
  "savings",
  "misc",
]);

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#f97316" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Housing", color: "#8b5cf6" },
  { name: "Utilities", color: "#06b6d4" },
  { name: "Savings", color: "#22c55e" },
  { name: "Misc", color: "#a3a3a3" },
];

const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const normalizeName = (name: string) => name.trim().toLowerCase();

const isSystemCategory = (category: Category) => {
  return SYSTEM_CATEGORY_NAMES.has(normalizeName(category.name));
};

export const createCategoryListConfig = (
  userId: string,
  onToggleActive: (category: Category, nextState: boolean) => void
): ListConfig<Category> => ({
  // Identity
  queryKey: "categories",

  // Display
  title: "Categories",
  description: "Manage your expense categories",
  emptyMessage: "No categories yet. System categories will appear when activated.",
  emptyMessageFiltered: "No categories found matching your filters",
  searchPlaceholder: "Search categories...",

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
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "system", label: "System" },
        { value: "custom", label: "Custom" },
      ],
    },
  ] as FilterConfig[],

  sortOptions: [
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
  ],
  defaultSort: "name-asc",
  searchFields: ["name"],

  // Metrics
  metrics: [
    {
      key: "total",
      label: "Total",
      type: "count",
      icon: Tag,
    },
    {
      key: "active",
      label: "Active",
      type: "count",
      icon: ToggleLeft,
    },
    {
      key: "inactive",
      label: "Inactive",
      type: "count",
      icon: ToggleLeft,
    },
  ],

  calculateMetrics: (items: Category[]) => {
    const activeCount = items.filter((c) => c.isActive !== false).length;
    return {
      total: items.length,
      active: activeCount,
      inactive: items.length - activeCount,
    };
  },

  // Views
  availableViews: ["grid", "list"],
  defaultView: "grid",

  // Rendering Functions
  renderListItem: (item: Category, index: number, actions) => {
    const active = item.isActive !== false;
    const system = isSystemCategory(item);

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
        style={{ opacity: active ? 1 : 0.6 }}
      >
        {/* Badge */}
        <Badge
          style={{
            backgroundColor: item.color || CATEGORY_COLORS[0],
            color: "white",
          }}
          className="text-xs px-2 py-1"
        >
          {item.name}
        </Badge>

        {/* Type indicator */}
        <Badge variant="outline" className="text-xs px-1.5 py-0">
          {system ? "System" : "Custom"}
        </Badge>

        <div className="flex-1" />

        {/* Status & Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {active ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={active}
            onCheckedChange={(checked) => onToggleActive(item, checked)}
          />
        </div>
      </div>
    );
  },

  renderGridCard: (item: Category, index: number, actions) => {
    const active = item.isActive !== false;
    const system = isSystemCategory(item);

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-full border px-4 py-2 transition-colors"
        style={{ opacity: active ? 1 : 0.6 }}
      >
        {/* Badge */}
        <Badge
          style={{
            backgroundColor: item.color || CATEGORY_COLORS[0],
            color: "white",
          }}
          className="text-xs px-2 py-1"
        >
          {item.name}
        </Badge>

        {/* Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {active ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={active}
            onCheckedChange={(checked) => onToggleActive(item, checked)}
          />
        </div>
      </div>
    );
  },

  // Actions
  actions: {
    edit: async (item: Category) => {
      // Category editing will be handled differently
      // System categories can only be toggled, not edited
    },
    delete: async (id: string) => {
      // Only custom categories can be deleted
      await db.transact(db.tx.categories[id].delete());
    },
  },

  // Data transformation
  getItemId: (item: Category) => item.id,

  // Custom filter
  customFilter: (item: Category, searchQuery: string, filters: any) => {
    // Apply status filter
    const statusFilter = filters.status;
    if (statusFilter && statusFilter !== "all") {
      const active = item.isActive !== false;
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;
    }

    // Apply type filter
    const typeFilter = filters.type;
    if (typeFilter && typeFilter !== "all") {
      const system = isSystemCategory(item);
      if (typeFilter === "system" && !system) return false;
      if (typeFilter === "custom" && system) return false;
    }

    // Apply search
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  },

  // Custom sort
  customSort: (a: Category, b: Category, sortBy: string) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return a.name.localeCompare(b.name);
    }
  },
});

// Export helper for adding missing system categories
export function getDisplayCategories(
  userCategories: Category[]
): Category[] {
  const existingNames = new Set(
    userCategories.map((c) => normalizeName(c.name))
  );

  // Add missing system categories as inactive templates
  const missingSystemCategories: Category[] = DEFAULT_CATEGORIES.filter(
    (defaultCat) => !existingNames.has(normalizeName(defaultCat.name))
  ).map((defaultCat) => ({
    id: `template-${defaultCat.name}`,
    name: defaultCat.name,
    color: defaultCat.color,
    icon: "",
    isActive: false,
    createdAt: 0,
    updatedAt: 0,
  }));

  return [...userCategories, ...missingSystemCategories];
}
