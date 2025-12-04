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
}: MoneeCardProps) {
  const amountColor = {
    expense: "text-red-600 dark:text-red-400",
    income: "text-green-600 dark:text-green-400",
    debt: "text-orange-600 dark:text-orange-400",
    savings: "text-blue-600 dark:text-blue-400",
  }[type];

  return (
    <div className="group relative">
      <div className="bg-card border border-border rounded-md p-2.5 hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-2">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Amount and Name Row */}
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={cn(
                  "text-base font-bold tabular-nums leading-tight",
                  amountColor
                )}
              >
                {typeof amount === "number"
                  ? `Ksh ${amount.toLocaleString()}`
                  : `Ksh ${amount}`}
              </span>
              <span className="text-xs font-medium text-foreground truncate">
                {name}
              </span>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                {category}
              </span>
              <span>{date}</span>
            </div>

            {/* Secondary Value if provided */}
            {secondaryValue && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                <span>{secondaryLabel}:</span>
                <span className="font-medium ml-1">{secondaryValue}</span>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          {showActions && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
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
          <p className="text-[10px] text-muted-foreground mt-0.5">{total}</p>
        )}
      </div>
      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {count} items
      </span>
    </div>
  );
}
