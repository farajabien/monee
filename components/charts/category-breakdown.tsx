"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
}

interface CategoryBreakdownProps {
  items: CategoryItem[];
  formatAmount?: (amount: number) => string;
}

export function CategoryBreakdown({
  items,
  formatAmount = (amount) => `KSh ${amount.toLocaleString()}`,
}: CategoryBreakdownProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {Icon && (
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: item.color
                      ? `${item.color}20`
                      : "hsl(var(--muted))",
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: item.color || "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatAmount(item.amount)}</p>
              <p className="text-xs text-muted-foreground">{item.percentage}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
