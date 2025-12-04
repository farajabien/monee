"use client";

import type React from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MoneeCardProps {
  id?: string;
  amount: string | number;
  name: string;
  category: string;
  date: string;
  onEdit?: () => void;
  onDelete?: () => void;
  type?: "expense" | "income" | "debt" | "savings";
  secondaryValue?: string;
  secondaryLabel?: string;
  showActions?: boolean;
  formattedAmount?: string;
}

export function MoneeCard({
  amount,
  name,
  category,
  date,
  onEdit,
  onDelete,
  type = "expense",
  secondaryValue,
  secondaryLabel,
  showActions = true,
  formattedAmount,
}: MoneeCardProps) {
  const amountColor = {
    expense: "text-red-600 dark:text-red-400",
    income: "text-green-600 dark:text-green-400",
    debt: "text-orange-600 dark:text-orange-400",
    savings: "text-blue-600 dark:text-blue-400",
  }[type];

  const displayAmount = formattedAmount || 
    (typeof amount === "number" ? amount.toLocaleString() : amount);

  return (
    <div className="group relative">
      <div className="bg-card border border-border rounded-md p-2.5 hover:border-primary/50 hover:shadow-sm transition-all">
        {/* Actions Menu - Top Right */}
        {showActions && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 pr-8">
          {/* Amount and Name Row */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className={cn(
                "text-sm sm:text-base font-bold tabular-nums leading-tight",
                amountColor
              )}
            >
              {displayAmount}
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-foreground truncate">
              {name}
            </span>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
            <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
              {category}
            </span>
            <span>{date}</span>
          </div>

          {/* Secondary Value if provided */}
          {secondaryValue && (
            <div className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground">
              <span>{secondaryLabel}:</span>
              <span className="font-medium ml-1">{secondaryValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MoneeDashboardMetric({
  label,
  value,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: "primary" | "accent" | "secondary" | "muted";
}) {
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
  }[color];

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className={cn("h-3.5 w-3.5", colorClasses)} />}
        <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-lg sm:text-xl font-bold tabular-nums leading-tight">{value}</p>
    </div>
  );
}

export function MoneeListHeader({
  title,
  count,
  total,
}: {
  title: string;
  count: number;
  total?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {total && (
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{total}</p>
        )}
      </div>
      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {count} items
      </span>
    </div>
  );
}
