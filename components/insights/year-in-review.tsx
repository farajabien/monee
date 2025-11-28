"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useYearAnalysis, useAvailableYears } from "@/hooks/use-year-analysis";
import { YearStatsDisplay } from "./year-stats-display";

export function YearInReview() {
  const user = db.useAuth();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: { "user.id": user.user?.id },
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.user?.id },
      },
    },
    categories: {
      $: {
        where: { "user.id": user.user?.id },
      },
    },
    budgets: {
      $: {
        where: { "user.id": user.user?.id },
      },
    },
    debts: {
      $: {
        where: { "user.id": user.user?.id },
      },
    },
  });

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const recipients = useMemo(() => data?.recipients || [], [data?.recipients]);
  const categories = useMemo(() => data?.categories || [], [data?.categories]);
  const budgets = useMemo(() => data?.budgets || [], [data?.budgets]);
  const debts = useMemo(() => data?.debts || [], [data?.debts]);

  // Get available years from expenses
  const availableYears = useAvailableYears(expenses);
  const currentYear = new Date().getFullYear();
  const defaultYear = availableYears.includes(currentYear)
    ? currentYear
    : availableYears[0] || currentYear;

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Build recipient nicknames map
  const recipientNicknames = useMemo(() => {
    const map = new Map<string, string>();
    recipients.forEach((r) => {
      if (r.originalName && r.nickname) {
        map.set(r.originalName, r.nickname);
      }
    });
    return map;
  }, [recipients]);

  // Use shared year analysis hook
  const yearStats = useYearAnalysis(expenses, selectedYear, {
    recipientNicknames,
    includeAchievements: {
      categories: categories as any[],
      budgets: budgets as any[],
      debts: debts as any[],
    },
    groupBy: "category",
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!user.user) {
    return null;
  }

  if (availableYears.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground">
            Add expenses to see your year-in-review insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state for selected year
  if (!yearStats || yearStats.totalExpenses === 0) {
    return (
      <div className="space-y-6">
        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <Label htmlFor="year-select">Select Year</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger id="year-select" className="w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              No {selectedYear} Data Yet
            </h3>
            <p className="text-muted-foreground">
              Add expenses from {selectedYear} to see your year-in-review
              insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Year selector component (only show if multiple years available)
  const yearSelector = availableYears.length > 1 ? (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="year-select" className="text-sm font-medium">
            Select Year:
          </Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger id="year-select" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  ) : null;

  return (
    <YearStatsDisplay
      yearStats={yearStats}
      formatAmount={formatAmount}
      showAchievements={true}
      headerAction={yearSelector}
    />
  );
}
