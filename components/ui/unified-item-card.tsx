/**
 * Unified Item Card Component
 * 
 * Standardized card design for Expenses, Debts, and Savings
 * Based on the successful savings card design pattern
 */

import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

export interface UnifiedItemCardProps {
  index: number;
  // Primary badge - shown prominently at top
  primaryBadge: {
    value: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
    icon?: string;
    className?: string;
  };
  // Main title
  title: string;
  emoji?: string;
  // Secondary badges (category, status, etc)
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    icon?: string;
    className?: string;
  }>;
  // Metadata row (date, payment info, etc)
  metadata?: Array<{
    icon: ReactNode;
    text: string;
  }>;
  // Optional progress bar
  progress?: {
    value: number; // 0-100
    label: string;
    secondaryLabel?: string;
    color?: string;
  };
  // Secondary info text
  secondaryInfo?: string;
  // Actions
  actions: {
    onEdit?: () => void;
    onDelete?: () => void;
    onPrimaryAction?: {
      label: string;
      onClick: () => void;
      variant?: "default" | "outline" | "success";
    };
  };
}

export function UnifiedItemCard({
  index,
  primaryBadge,
  title,
  emoji,
  badges = [],
  metadata = [],
  progress,
  secondaryInfo,
  actions,
}: UnifiedItemCardProps) {
  return (
    <div className="rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="p-3 space-y-2">
        {/* Header: index + emoji/title + primary badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="text-xs shrink-0">
              #{index + 1}
            </Badge>
            {emoji && <span className="text-2xl shrink-0">{emoji}</span>}
            <h3 className="font-semibold text-base truncate">{title}</h3>
          </div>
        </div>

        {/* Primary badge + secondary badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={primaryBadge.variant || "secondary"}
            className={primaryBadge.className || "text-xs px-1.5 py-0.5 font-semibold"}
          >
            {primaryBadge.icon && <span className="mr-1">{primaryBadge.icon}</span>}
            {primaryBadge.value}
          </Badge>
          {badges.map((badge, idx) => (
            <Badge
              key={idx}
              variant={badge.variant || "outline"}
              className={badge.className || "text-xs px-1.5 py-0.5"}
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.label}
            </Badge>
          ))}
        </div>

        {/* Progress bar (optional) */}
        {progress && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress.value}%`,
                  backgroundColor: progress.color || "hsl(var(--primary))",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.label}</span>
              {progress.secondaryLabel && <span>{progress.secondaryLabel}</span>}
            </div>
          </div>
        )}

        {/* Metadata row */}
        {metadata.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Secondary info */}
        {secondaryInfo && (
          <p className="text-xs text-muted-foreground">{secondaryInfo}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {actions.onPrimaryAction && (
            <button
              onClick={actions.onPrimaryAction.onClick}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                actions.onPrimaryAction.variant === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : actions.onPrimaryAction.variant === "outline"
                  ? "border border-input bg-background hover:bg-accent"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {actions.onPrimaryAction.label}
            </button>
          )}
          <div className="flex gap-1 shrink-0">
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
      </div>
    </div>
  );
}
