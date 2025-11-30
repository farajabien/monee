/**
 * Savings Goal List Configuration
 *
 * Defines how savings goals are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { SavingsGoalWithContributions } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp } from "lucide-react";
import db from "@/lib/db";
import { tx } from "@instantdb/react";
import { toast } from "sonner";

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const calculateProgress = (currentAmount: number, targetAmount: number) => {
  if (targetAmount === 0) return 100;
  return Math.min((currentAmount / targetAmount) * 100, 100);
};

export const createSavingsGoalListConfig = (
  onAddMoney: (goal: SavingsGoalWithContributions) => void,
  onMarkComplete: (goalId: string) => void,
  onEdit: (goal: SavingsGoalWithContributions) => void
): ListConfig<SavingsGoalWithContributions> => ({
  // Identity
  queryKey: "savings_goals",

  // Display
  title: "Savings Goals",
  description: "Track and manage your savings goals",
  emptyMessage:
    "No savings goals yet. Create your first savings goal above to start tracking your progress!",
  emptyMessageFiltered: "No savings goals found",
  searchPlaceholder: "Search savings goals...",

  // Filters & Sort
  sortOptions: [
    { value: "progress-desc", label: "Progress (High to Low)" },
    { value: "progress-asc", label: "Progress (Low to High)" },
    { value: "amount-desc", label: "Target Amount (High to Low)" },
    { value: "amount-asc", label: "Target Amount (Low to High)" },
    { value: "deadline-asc", label: "Deadline (Nearest First)" },
  ],
  defaultSort: "progress-desc",
  searchFields: ["name"],

  // Metrics
  metrics: [],

  // Views
  availableViews: ["list"],
  defaultView: "list",

  // Rendering Functions
  renderListItem: (
    item: SavingsGoalWithContributions,
    index: number,
    actions
  ) => {
    const progress = calculateProgress(item.currentAmount, item.targetAmount);
    const remaining = item.targetAmount - item.currentAmount;
    const isCompleted =
      item.isCompleted || item.currentAmount >= item.targetAmount;

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>

          <div className="flex-1 space-y-1">
            {/* Line 1: Name + inline badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {item.emoji || "💰"} {item.name}
              </span>
              <Badge variant="secondary">
                {formatCurrency(item.currentAmount)}
              </Badge>
              <Badge variant="outline">
                Target: {formatCurrency(item.targetAmount)}
              </Badge>
              <Badge variant="outline">{Math.round(progress)}% saved</Badge>
              {isCompleted && (
                <Badge className="bg-green-500">✓ Goal Achieved!</Badge>
              )}
            </div>

            {/* Line 2: Metadata */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {item.deadline && (
                <>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatDate(item.deadline)}</span>
                  </div>
                  <span>•</span>
                </>
              )}
              {!isCompleted && (
                <>
                  <span>{formatCurrency(remaining)} to go</span>
                  <span>•</span>
                </>
              )}
              {item.contributions && item.contributions.length > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    {item.contributions.length} contribution
                    {item.contributions.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {!isCompleted && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onAddMoney(item)}
            >
              Add Money
            </Button>
          )}
          {progress >= 100 && !item.isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkComplete(item.id)}
            >
              Mark Complete
            </Button>
          )}
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
    edit: async (item: SavingsGoalWithContributions) => {
      onEdit(item);
    },
    delete: async (id: string) => {
      await db.transact(tx.savings_goals[id].delete());
      toast.success("Goal deleted");
    },
  },

  // Data transformation
  getItemId: (item: SavingsGoalWithContributions) => item.id,

  // Custom filter
  customFilter: (item: SavingsGoalWithContributions, searchQuery: string) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  },

  // Custom sort
  customSort: (
    a: SavingsGoalWithContributions,
    b: SavingsGoalWithContributions,
    sortBy: string
  ) => {
    switch (sortBy) {
      case "progress-desc": {
        const progressA = calculateProgress(a.currentAmount, a.targetAmount);
        const progressB = calculateProgress(b.currentAmount, b.targetAmount);
        return progressB - progressA;
      }
      case "progress-asc": {
        const progressA = calculateProgress(a.currentAmount, a.targetAmount);
        const progressB = calculateProgress(b.currentAmount, b.targetAmount);
        return progressA - progressB;
      }
      case "amount-desc":
        return b.targetAmount - a.targetAmount;
      case "amount-asc":
        return a.targetAmount - b.targetAmount;
      case "deadline-asc":
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      default:
        return 0;
    }
  },
});
