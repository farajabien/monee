/**
 * StandardListItem Component
 *
 * Consistent list item renderer for all lists
 * Uses the Item component with standardized structure
 */

"use client";

import { Item, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, LucideIcon } from "lucide-react";
import type { MetadataField } from "@/types/list-config";

interface StandardListItemProps {
  // Core content
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: "default" | "outline" | "secondary" | "destructive";
    className?: string;
  };

  // Metadata fields (displayed as key-value pairs)
  metadata?: MetadataField[];

  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "destructive";
  }[];

  // Styling
  variant?: "default" | "outline" | "muted";
  size?: "default" | "sm";
  className?: string;
}

export function StandardListItem({
  title,
  subtitle,
  badge,
  metadata,
  onEdit,
  onDelete,
  customActions,
  variant = "outline",
  size = "sm",
  className,
}: StandardListItemProps) {
  return (
    <Item variant={variant} size={size} className={className}>
      <ItemContent className="gap-2">
        {/* Header with badge and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <Badge
                variant={badge.variant || "outline"}
                className={badge.className || "text-[10px] px-1.5 py-0"}
              >
                {badge.label}
              </Badge>
            )}
          </div>

          <div className="flex gap-0.5 shrink-0">
            {customActions?.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button
                  key={idx}
                  variant={action.variant || "ghost"}
                  size="icon"
                  className="h-6 w-6"
                  onClick={action.onClick}
                  aria-label={action.label}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                </Button>
              );
            })}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
                aria-label="Edit"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={onDelete}
                aria-label="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <ItemTitle className="text-base font-semibold">{title}</ItemTitle>

        {/* Subtitle */}
        {subtitle && (
          <ItemDescription className="text-xs line-clamp-1">
            {subtitle}
          </ItemDescription>
        )}

        {/* Metadata fields */}
        {metadata && metadata.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-1">
            {metadata.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span className="font-medium">{field.label}:</span>
                  <span>{field.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </ItemContent>
    </Item>
  );
}
