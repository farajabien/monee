/**
 * ListMetrics Component
 *
 * Displays metrics in a compact horizontal layout
 * Numbers first, no icon clutter
 */

"use client";

import type { MetricConfig, MetricValues } from "@/types/list-config";

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
    if (num >= 1000000) return `Ksh ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Ksh ${(num / 1000).toFixed(1)}K`;
    return `Ksh ${num}`;
  };

  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {metrics.map((metric, index) => {
        const value = values[metric.key];
        if (value === undefined) return null;

        const formattedValue = metric.type === "currency" && value >= 1000
          ? formatCompact(value)
          : formatValue(value, metric.type, metric.format);

        return (
          <div key={metric.key} className="flex items-center gap-3">
            <span className="whitespace-nowrap">
              <span className="font-semibold text-foreground">{formattedValue}</span>
              {metric.label && <span className="ml-1">{metric.label.toLowerCase()}</span>}
            </span>
            {index < metrics.length - 1 && (
              <span className="text-muted-foreground/50">•</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
