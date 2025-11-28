/**
 * Savings Goal List Configuration
 *
 * Defines how savings goals are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { SavingsGoalWithContributions } from "@/types";
import { StandardGridCard } from "@/components/ui/standard-grid-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, CalendarDays, TrendingUp, CheckCircle } from "lucide-react";
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
  onMarkComplete: (goalId: string) => void
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
  availableViews: ["grid"],
  defaultView: "grid",

  // Rendering Functions
  renderListItem: () => null, // Not used for savings goals

  renderGridCard: (
    item: SavingsGoalWithContributions,
    index: number,
    actions
  ) => {
    const progress = calculateProgress(item.currentAmount, item.targetAmount);
    const remaining = item.targetAmount - item.currentAmount;
    const isCompleted =
      item.isCompleted || item.currentAmount >= item.targetAmount;

    const footerContent = isCompleted ? (
      <Badge variant="outline" className="text-green-600 w-full justify-center">
        Goal Achieved! 🎉
      </Badge>
    ) : (
      <div className="flex gap-2 w-full">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onAddMoney(item)}
        >
          Add Money
        </Button>
        {progress >= 100 && !item.isCompleted && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMarkComplete(item.id)}
          >
            Mark Complete
          </Button>
        )}
      </div>
    );

    return (
      <StandardGridCard
        key={item.id}
        title={item.name}
        emoji={item.emoji || "💰"}
        statusBadge={
          isCompleted
            ? {
                label: "Completed!",
                variant: "default",
                className: "bg-green-600",
              }
            : undefined
        }
        mainValue={formatCurrency(item.currentAmount)}
        subtitle={`${Math.round(progress)}% complete`}
        description={
          !isCompleted ? `${formatCurrency(remaining)} to go` : undefined
        }
        progress={{
          value: progress,
          showPercentage: false,
        }}
        metadata={[
          {
            label: "Target",
            value: formatCurrency(item.targetAmount),
            icon: Target,
          },
          ...(item.deadline
            ? [
                {
                  label: "Due",
                  value: formatDate(item.deadline),
                  icon: CalendarDays,
                },
              ]
            : []),
          ...(item.contributions && item.contributions.length > 0
            ? [
                {
                  label: "Contributions",
                  value: `${item.contributions.length} contribution${
                    item.contributions.length !== 1 ? "s" : ""
                  }`,
                  icon: TrendingUp,
                },
              ]
            : []),
        ]}
        onDelete={actions.onDelete}
        footerContent={footerContent}
        className={
          isCompleted
            ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
            : ""
        }
      />
    );
  },

  // Actions
  actions: {
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
