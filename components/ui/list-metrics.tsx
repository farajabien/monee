/**
 * ListMetrics Component
 *
 * Displays metric badges at the top of lists
 * Consistent formatting and responsive layout
 */

"use client";

import { Badge } from "@/components/ui/badge";
import type { MetricConfig, MetricValues } from "@/types/list-config";
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

interface ListMetricsProps {
  metrics: MetricConfig[];
  values: MetricValues;
}

export function ListMetrics({ metrics, values }: ListMetricsProps) {
  const formatValue = (value: number, type: MetricConfig["type"], customFormat?: (v: number) => string) => {
    if (customFormat) {
      return customFormat(value);
    }

    switch (type) {
      case "currency":
        return formatCurrency(value);
      case "count":
        return value.toString();
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "average":
        return formatCurrency(value);
      default:
        return value.toString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getIcon = (iconProp?: LucideIcon | string) => {
    if (!iconProp) return null;
    if (typeof iconProp === "string") {
      const IconComponent = (Icons as any)[iconProp] as LucideIcon;
      return IconComponent ? <IconComponent className="h-3 w-3 mr-1" /> : null;
    }
    const IconComponent = iconProp;
    return <IconComponent className="h-3 w-3 mr-1" />;
  };

  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {metrics.map((metric) => {
        const value = values[metric.key];
        if (value === undefined) return null;

        return (
          <Badge
            key={metric.key}
            variant={metric.key === "totalSpent" || metric.key === "totalDebt" ? "secondary" : "outline"}
            className={`text-xs px-2 py-0.5 ${metric.className || ""}`}
          >
            {getIcon(metric.icon)}
            {metric.label && <span className="mr-1">{metric.label}:</span>}
            <span className="font-semibold">
              {metric.type === "currency" && value >= 1000
                ? `Ksh ${formatCompact(value)}`
                : formatValue(value, metric.type, metric.format)}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}
