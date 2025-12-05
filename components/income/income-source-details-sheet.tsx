"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  CalendarCheck,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { IncomeSource } from "@/types";

interface IncomeSourceDetailsSheetProps {
  incomeSource: IncomeSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncomeSourceDetailsSheet({
  incomeSource,
  open,
  onOpenChange,
}: IncomeSourceDetailsSheetProps) {
  const { formatCurrency } = useCurrency();

  const calculations = useMemo(() => {
    if (!incomeSource) return null;

    // Calculate multipliers for annual income
    const frequencyMultipliers = {
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      annually: 1,
    } as const;

    const multiplier =
      frequencyMultipliers[
        incomeSource.frequency as keyof typeof frequencyMultipliers
      ] || 12;
    const annualIncome = incomeSource.amount * multiplier;
    const monthlyEquivalent = annualIncome / 12;
    const dailyAverage = annualIncome / 365;

    // Calculate next payday
    let nextPayday = null;
    const now = new Date();

    if (incomeSource.frequency === "monthly") {
      const nextMonth =
        incomeSource.paydayDay < now.getDate()
          ? new Date(now.getFullYear(), now.getMonth() + 1, incomeSource.paydayDay)
          : new Date(
              now.getFullYear(),
              now.getMonth(),
              incomeSource.paydayDay
            );
      nextPayday = nextMonth;
    } else if (incomeSource.frequency === "biweekly") {
      // Approximate - every 14 days from today
      nextPayday = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (incomeSource.frequency === "weekly") {
      // Approximate - every 7 days from today
      nextPayday = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (incomeSource.frequency === "quarterly") {
      // Every 3 months
      nextPayday = new Date(now.getFullYear(), now.getMonth() + 3, incomeSource.paydayDay);
    } else if (incomeSource.frequency === "annually") {
      // Once per year
      if (incomeSource.paydayMonth !== undefined) {
        nextPayday = new Date(
          now.getFullYear(),
          incomeSource.paydayMonth,
          incomeSource.paydayDay
        );
        if (nextPayday < now) {
          nextPayday = new Date(
            now.getFullYear() + 1,
            incomeSource.paydayMonth,
            incomeSource.paydayDay
          );
        }
      }
    }

    // Days until next payday
    let daysUntilPayday = null;
    if (nextPayday) {
      const diff = nextPayday.getTime() - now.getTime();
      daysUntilPayday = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Expected income for current year (remaining)
    const monthsRemaining = 12 - now.getMonth();
    const expectedYearIncome = monthlyEquivalent * monthsRemaining;

    return {
      annualIncome,
      monthlyEquivalent,
      dailyAverage,
      nextPayday,
      daysUntilPayday,
      expectedYearIncome,
    };
  }, [incomeSource]);

  if (!incomeSource) return null;

  const formatDate = (timestamp: number | Date) => {
    const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annually: "Annually",
    } as const;
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getPaydayLabel = (frequency: string, day: number, month?: number) => {
    if (frequency === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Every ${days[day % 7]}`;
    } else if (frequency === "biweekly") {
      return `Every 2 weeks`;
    } else if (frequency === "monthly") {
      const suffix =
        day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
          ? "rd"
          : "th";
      return `${day}${suffix} of each month`;
    } else if (frequency === "quarterly") {
      const suffix =
        day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
          ? "rd"
          : "th";
      return `${day}${suffix} every 3 months`;
    } else if (frequency === "annually" && month !== undefined) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const suffix =
        day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
          ? "rd"
          : "th";
      return `${monthNames[month]} ${day}${suffix}`;
    }
    return "Once per year";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {incomeSource.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview Section */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Income Amount</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(incomeSource.amount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {getFrequencyLabel(incomeSource.frequency)}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge
              variant={incomeSource.isActive ? "default" : "secondary"}
              className="px-3 py-1"
            >
              {incomeSource.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Schedule Information */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Payment Schedule</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <span className="font-medium">
                  {getFrequencyLabel(incomeSource.frequency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payday</span>
                <span className="font-medium">
                  {getPaydayLabel(
                    incomeSource.frequency,
                    incomeSource.paydayDay,
                    incomeSource.paydayMonth
                  )}
                </span>
              </div>
              {calculations?.nextPayday && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarCheck className="h-4 w-4" />
                    <span>Next Payday</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatDate(calculations.nextPayday)}
                  </span>
                </div>
              )}
              {calculations?.daysUntilPayday && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Days Until Payment
                  </span>
                  <span className="font-medium">
                    {calculations.daysUntilPayday} days
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Calculations */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Income Breakdown</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Annual Income
                </span>
                <span className="font-semibold">
                  {formatCurrency(calculations?.annualIncome || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Monthly Equivalent
                </span>
                <span className="font-medium">
                  {formatCurrency(calculations?.monthlyEquivalent || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Daily Average
                </span>
                <span className="font-medium">
                  {formatCurrency(calculations?.dailyAverage || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Expected Income for Year */}
          {incomeSource.isActive && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Expected Income</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Remaining This Year
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(calculations?.expectedYearIncome || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on your current payment schedule
                </p>
              </CardContent>
            </Card>
          )}

          {/* Created Date */}
          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            Created on {formatDate(incomeSource.createdAt)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
