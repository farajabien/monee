/**
 * Compact Item Card Component
 *
 * Lean, single-row card design for expenses, debts, savings, and income
 * Optimized for maximum information density with minimal vertical space
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, RepeatIcon } from "lucide-react";
import { ReactNode } from "react";

export interface CompactItemCardProps {
  // Core data
  index?: number;
  title: string;
  amount: string;
  amountColor?: "default" | "destructive" | "success" | "primary";

  // Optional display elements
  category?: string;
  date?: string;
  emoji?: string;
  secondaryInfo?: string; // Additional info to show (e.g., "45% paid", "3 months left")

  // Status indicators
  isRecurring?: boolean;
  isPaid?: boolean; // For recurring expenses
  isCompleted?: boolean; // For savings/debts
  customBadge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  };

  // Actions
  actions: {
    onEdit?: () => void;
    onDelete?: () => void;
    onPay?: () => void; // For recurring unpaid expenses
  };

  // Click handler for the entire card
  onClick?: () => void;
}

export function CompactItemCard({
  index,
  title,
  amount,
  amountColor = "default",
  category,
  date,
  emoji,
  secondaryInfo,
  isRecurring = false,
  isPaid = false,
  isCompleted = false,
  customBadge,
  actions,
  onClick,
}: CompactItemCardProps) {
  const getAmountColorClass = () => {
    switch (amountColor) {
      case "destructive":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
      case "primary":
        return "text-primary bg-primary/10";
      default:
        return "text-foreground bg-muted";
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card
        hover:bg-accent/30 transition-colors min-h-[52px]
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      {/* Left Section: Index + Amount */}
      <div className="flex items-center gap-2 shrink-0">
        {index !== undefined && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 w-7 justify-center shrink-0">
            #{index + 1}
          </Badge>
        )}
        <div className={`px-2 py-1 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap ${getAmountColorClass()}`}>
          {amount}
        </div>
      </div>

      {/* Middle Section: Title + Metadata */}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 min-w-0">
          {emoji && <span className="text-base shrink-0">{emoji}</span>}
          <span className="font-medium text-sm truncate">{title}</span>
        </div>

        {/* Badges and metadata */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap">
              {category}
            </Badge>
          )}

          {date && (
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
              {date}
            </span>
          )}

          {secondaryInfo && (
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
              • {secondaryInfo}
            </span>
          )}

          {isRecurring && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 shrink-0">
              <RepeatIcon className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">Recurring</span>
            </Badge>
          )}

          {customBadge && (
            <Badge
              variant={customBadge.variant || "outline"}
              className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap"
            >
              {customBadge.label}
            </Badge>
          )}

          {isCompleted && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-green-600 border-green-600">
              ✓ Done
            </Badge>
          )}
        </div>
      </div>

      {/* Right Section: Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Pay button for unpaid recurring expenses */}
        {isRecurring && !isPaid && actions.onPay && (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              actions.onPay?.();
            }}
          >
            Pay
          </Button>
        )}

        {/* Actions menu */}
        {(actions.onEdit || actions.onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {actions.onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.onEdit?.();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.onDelete?.();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
