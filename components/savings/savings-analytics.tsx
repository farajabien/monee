"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CategoryBreakdown } from "@/components/charts/category-breakdown";
import { Wallet, TrendingUp, Target, Calendar } from "lucide-react";
import db from "@/lib/db";

type TimeView = "week" | "month" | "year";

export function SavingsAnalytics() {
  const [timeView, setTimeView] = useState<TimeView>("month");
  const [chartType, setChartType] = useState<"bar" | "line">("line");

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      savingsGoals: {
        contributions: {},
      },
    },
  });

  const profile = data?.profiles?.[0];
  const savingsGoals = profile?.savingsGoals || [];

  // Chart config for Shadcn charts
  const chartConfig = {
    value: {
      label: "Total Saved",
      color: "hsl(142 76% 36%)", // green color
    },
  } satisfies ChartConfig;

  // Calculate total saved
  const totalSaved = savingsGoals.reduce((sum, goal) => {
    const goalContributions = goal.contributions || [];
    const saved = goalContributions.reduce(
      (cSum, c) => cSum + (c.amount || 0),
      0
    );
    return sum + saved;
  }, 0);

  // Calculate total targets
  const totalTargets = savingsGoals.reduce(
    (sum, goal) => sum + (goal.targetAmount || 0),
    0
  );

  // Calculate progress percentage
  const progressPercentage =
    totalTargets > 0 ? (totalSaved / totalTargets) * 100 : 0;

  // Prepare savings growth over time data
  const savingsOverTimeData = useMemo(() => {
    if (!savingsGoals.length) return [];

    // Get all contributions
    const allContributions: Array<{ date: number; amount: number }> = [];
    savingsGoals.forEach((goal) => {
      goal.contributions?.forEach((contribution) => {
        allContributions.push({
          date: contribution.date || contribution.createdAt,
          amount: contribution.amount || 0,
        });
      });
    });

    // Sort by date
    allContributions.sort((a, b) => a.date - b.date);

    // Calculate savings over time
    let currentSavings = 0;
    const dataPoints: Array<{ name: string; value: number }> = [];

    if (timeView === "week") {
      // Last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = date.setHours(0, 0, 0, 0);
        const dayEnd = date.setHours(23, 59, 59, 999);

        const dayContributions = allContributions.filter(
          (c) => c.date >= dayStart && c.date <= dayEnd
        );
        const dayTotal = dayContributions.reduce((sum, c) => sum + c.amount, 0);
        currentSavings += dayTotal;

        dataPoints.push({
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          value: currentSavings,
        });
      }
    } else if (timeView === "month") {
      // Last 30 days grouped by week
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const today = new Date();

      weeks.forEach((week, index) => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (30 - index * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekContributions = allContributions.filter(
          (c) => c.date >= weekStart.getTime() && c.date < weekEnd.getTime()
        );
        const weekTotal = weekContributions.reduce(
          (sum, c) => sum + c.amount,
          0
        );
        currentSavings += weekTotal;

        dataPoints.push({
          name: week,
          value: currentSavings,
        });
      });
    } else {
      // Last 12 months
      const months = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
          name: date.toLocaleDateString("en-US", { month: "short" }),
          date: date,
        });
      }

      months.forEach((month) => {
        const monthStart = month.date.getTime();
        const monthEnd = new Date(
          month.date.getFullYear(),
          month.date.getMonth() + 1,
          0
        ).getTime();

        const monthContributions = allContributions.filter(
          (c) => c.date >= monthStart && c.date <= monthEnd
        );
        const monthTotal = monthContributions.reduce(
          (sum, c) => sum + c.amount,
          0
        );
        currentSavings += monthTotal;

        dataPoints.push({
          name: month.name,
          value: currentSavings,
        });
      });
    }

    return dataPoints;
  }, [savingsGoals, timeView]);

  // Prepare category breakdown data
  const categoryData = useMemo(() => {
    if (!savingsGoals.length) return [];

    return savingsGoals.map((goal) => {
      const saved =
        goal.contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const percentage = totalSaved > 0 ? (saved / totalSaved) * 100 : 0;
      const targetAmount = goal.targetAmount || 0;
      const progress =
        targetAmount > 0 ? Math.round((saved / targetAmount) * 100) : 0;

      return {
        id: goal.id,
        name: goal.goalName || "Unnamed Goal",
        amount: saved,
        percentage: Math.round(percentage),
        subtitle: `Target: KSh ${targetAmount.toLocaleString()} (${progress}%)`,
        icon: Target,
        color: "#10b981", // green color for savings
      };
    });
  }, [savingsGoals, totalSaved]);

  // Calculate average monthly contribution
  const avgMonthlyContribution = useMemo(() => {
    const allContributions = savingsGoals.flatMap((g) => g.contributions || []);
    if (!allContributions.length) return 0;

    // Group by month
    const monthlyTotals = new Map<string, number>();
    allContributions.forEach((contribution) => {
      const date = new Date(contribution.date || contribution.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) || 0) + (contribution.amount || 0)
      );
    });

    const total = Array.from(monthlyTotals.values()).reduce(
      (sum, val) => sum + val,
      0
    );
    return monthlyTotals.size > 0 ? total / monthlyTotals.size : 0;
  }, [savingsGoals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading savings analytics
      </div>
    );
  }

  if (!savingsGoals.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Savings to Analyze</h3>
          <p className="text-sm text-muted-foreground">
            Create your first savings goal to see analytics and track your
            progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {totalSaved.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsGoals.length} active goal{savingsGoals.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(progressPercentage)}%
            </div>
            <p className="text-xs text-muted-foreground">
              of KSh {totalTargets.toLocaleString()} target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {Math.round(avgMonthlyContribution).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Contribution per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Savings Growth Over Time</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                Bar
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
              >
                Line
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Time View Selector */}
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={timeView === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeView("week")}
            >
              Week
            </Button>
            <Button
              variant={timeView === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeView("month")}
            >
              Month
            </Button>
            <Button
              variant={timeView === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeView("year")}
            >
              Year
            </Button>
          </div>

          {/* Chart */}
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            {chartType === "bar" ? (
              <BarChart data={savingsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={savingsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-value)", r: 4 }}
                />
              </LineChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Savings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown items={categoryData} />
        </CardContent>
      </Card>
    </div>
  );
}
