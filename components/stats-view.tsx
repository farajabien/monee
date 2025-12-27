"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";

interface StatsViewProps {
  profileId?: string;
}

type Period = "weekly" | "monthly" | "annually";

export function StatsView({ profileId }: StatsViewProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "annually">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch profile for currency preference
  const { data: profileData } = db.useQuery(
    profileId
      ? {
          profiles: {
            $: {
              where: {
                id: profileId,
              },
            },
          },
        }
      : null
  );

  const userCurrency = profileData?.profiles?.[0]?.currency || DEFAULT_CURRENCY;

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date(currentDate);
    let start: Date, end: Date;

    if (period === "weekly") {
      // Current week (Sunday to Saturday)
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "monthly") {
      // Current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Current year
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return { start: start.getTime(), end: end.getTime() };
  };

  const { start, end } = getDateRange();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: start, $lte: end },
        },
      },
    },
    income: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: start, $lte: end },
        },
      },
    },
  });

  const expenses = data?.expenses || [];
  const income = data?.income || [];

  // Calculate totals
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group expenses by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
  });

  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0",
    }));

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (period === "weekly") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (period === "monthly") {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setFullYear(currentDate.getFullYear() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDisplayDate = () => {
    if (period === "weekly") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      return `Week ${Math.ceil(currentDate.getDate() / 7)}, ${currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
    } else if (period === "monthly") {
      return currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  // Color palette for categories
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];

  return (
    <div className="pb-4">
      {/* Header with Period Navigation */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">{getDisplayDate()}</h2>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Period Selector */}
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Income/Expense Summary */}
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-semibold text-green-600">{formatCurrency(totalIncome, userCurrency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Exp.</p>
            <p className="font-semibold text-red-600">{formatCurrency(totalExpenses, userCurrency)}</p>
          </div>
        </div>
      </div>

      {/* Simple Bar Chart (Simplified Pie Chart Representation) */}
      {sortedCategories.length > 0 && (
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-medium mb-3">Expense Breakdown</h3>
          
          {/* Stacked Bar */}
          <div className="h-8 rounded-full overflow-hidden flex">
            {sortedCategories.map((item, idx) => (
              <div
                key={item.category}
                className={`${colors[idx % colors.length]} transition-all`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.category}: ${item.percentage}%`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="space-y-2 mt-4">
            {sortedCategories.map((item, idx) => (
              <Card key={item.category} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-6 h-6 rounded ${colors[idx % colors.length]}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-sm ml-2">
                    {formatCurrency(item.amount, userCurrency)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sortedCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground px-4">
          No expense data for this period
        </div>
      )}
    </div>
  );
}
