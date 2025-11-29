/**
 * StandardGridCard Component
 *
 * Consistent grid card renderer for all lists
 * Uses the Card component with standardized structure
 */

"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, LucideIcon } from "lucide-react";
import type { MetadataField } from "@/types/list-config";

interface StandardGridCardProps {
  // Header content
  title: string;
  emoji?: string;
  badge?: {
    label: string;
    variant?: "default" | "outline" | "secondary" | "destructive";
    className?: string;
  };
  statusBadge?: {
    label: string;
    variant?: "default" | "outline" | "secondary" | "destructive";
    className?: string;
  };

  // Main content
  mainValue?: string | React.ReactNode;
  subtitle?: string;
  description?: string;

  // Metadata fields (displayed as key-value pairs)
  metadata?: MetadataField[];

  // Progress indicator (optional)
  progress?: {
    value: number; // 0-100
    label?: string;
    showPercentage?: boolean;
  };

  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "destructive";
  }[];

  // Footer content
  footerContent?: React.ReactNode;

  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function StandardGridCard({
  title,
  emoji,
  badge,
  statusBadge,
  mainValue,
  subtitle,
  description,
  metadata,
  progress,
  onEdit,
  onDelete,
  customActions,
  footerContent,
  className,
  headerClassName,
  contentClassName,
}: StandardGridCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        {/* Badge row */}
        {badge && (
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant={badge.variant || "outline"}
              className={badge.className || "text-[10px] px-1.5 py-0"}
            >
              {badge.label}
            </Badge>
            <div className="flex gap-0.5">
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
        )}

        {/* Title with emoji and status badge */}
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </CardTitle>
          {statusBadge && (
            <Badge
              variant={statusBadge.variant || "default"}
              className={statusBadge.className}
            >
              {statusBadge.label}
            </Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <CardDescription className="text-xs">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={contentClassName}>
        {/* Main value */}
        {mainValue && (
          <div className="text-2xl font-bold mb-2">
            {mainValue}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div className="text-sm text-muted-foreground mb-3">
            {subtitle}
          </div>
        )}

        {/* Progress bar */}
        {progress && (
          <div className="space-y-1 mb-3">
            {progress.label && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress.label}</span>
                {progress.showPercentage && (
                  <span className="font-medium">{Math.round(progress.value)}%</span>
                )}
              </div>
            )}
            <Progress value={progress.value} className="h-2" />
          </div>
        )}

        {/* Metadata fields */}
        {metadata && metadata.length > 0 && (
          <div className="flex flex-col gap-1">
            {metadata.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span className="font-medium">{field.label}:</span>
                  <span>{field.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {footerContent && (
        <CardFooter className="pt-0">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
