/**
 * Savings Goal List Configuration
 *
 * Defines how savings goals are displayed, filtered, and sorted
 */

import type { ListConfig } from "@/types/list-config";
import type { SavingsGoalWithContributions } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { CompactItemCard } from "@/components/ui/compact-item-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
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

const formatDateCompact = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();

  // Show full date if different year
  if (date.getFullYear() !== today.getFullYear()) {
    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  }

  // Show month and day only if same year
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
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


  // Table columns
  tableColumns: [
    {
      accessorKey: "name",
      header: "Goal Name",
      cell: ({ row }) => {
        const emoji = row.original.emoji || "💰";
        return (
          <div className="flex items-center gap-2">
            <span>{emoji}</span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "currentAmount",
      header: () => <div className="text-right">Current</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold">
            {formatCurrency(row.original.currentAmount)}
          </div>
        );
      },
    },
    {
      accessorKey: "targetAmount",
      header: () => <div className="text-right">Target</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right text-sm">
            {formatCurrency(row.original.targetAmount)}
          </div>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress =
          (row.original.currentAmount / row.original.targetAmount) * 100;
        const isComplete = row.original.isCompleted;

        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
            {isComplete && (
              <Badge variant="outline" className="text-xs">
                ✓
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => {
        if (!row.original.deadline)
          return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="text-sm">
            {new Date(row.original.deadline).toLocaleDateString("en-KE", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row, table }) => {
        const goal = row.original;
        const meta = table.options.meta as {
          onEdit?: (item: SavingsGoalWithContributions) => void;
          onDelete?: (id: string) => void;
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {meta?.onEdit && (
                <DropdownMenuItem onClick={() => meta.onEdit!(goal)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {meta?.onDelete && (
                <DropdownMenuItem
                  onClick={() => meta.onDelete!(goal.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ] as ColumnDef<SavingsGoalWithContributions>[],

  // Rendering Functions
  renderListItem: (
    item: SavingsGoalWithContributions,
    index: number,
    actions
  ) => {
    const progress = calculateProgress(item.currentAmount, item.targetAmount);
    const isCompleted =
      item.isCompleted || item.currentAmount >= item.targetAmount;

    // Date display
    const dateText = item.deadline ? formatDateCompact(item.deadline) : "";

    return (
      <CompactItemCard
        key={item.id}
        index={index}
        emoji={item.emoji || "💰"}
        title={item.name}
        amount={formatCurrency(item.targetAmount)}
        amountColor={isCompleted ? "success" : "default"}
        category={`${Math.round(progress)}%`}
        date={dateText}
        secondaryInfo={`${formatCurrency(item.currentAmount)} saved`}
        isCompleted={isCompleted}
        actions={{
          onEdit: actions.onEdit,
          onDelete: actions.onDelete,
        }}
        customBadge={!isCompleted ? {
          label: "Add Money",
          variant: "default"
        } : undefined}
        onClick={!isCompleted ? () => onAddMoney(item) : undefined}
      />
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
