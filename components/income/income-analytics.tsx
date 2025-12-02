"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Briefcase,
  BarChart3,
  PieChart,
} from "lucide-react";
import db from "@/lib/db";

type TimeView = "week" | "month" | "year";

export function IncomeAnalytics() {
  const [timeView, setTimeView] = useState<TimeView>("month");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      incomeSources: {},
      expenses: {},
    },
  });

  const profile = data?.profiles?.[0];
  const incomeSources =
    profile?.incomeSources?.filter((source) => source.isActive) || [];
  const expenses = profile?.expenses || [];

  // Chart config for Shadcn charts
  const chartConfig = {
    value: {
      label: "Total Income",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  // Calculate total monthly income
  const totalMonthlyIncome = incomeSources.reduce(
    (sum, source) => sum + (source.amount || 0),
    0
  );

  // Calculate actual income received (from expense transactions marked as income)
  const actualIncome = useMemo(() => {
    // In a real implementation, you'd track income transactions separately
    // For now, we'll estimate based on monthly income sources
    return totalMonthlyIncome;
  }, [totalMonthlyIncome]);

  // Prepare income over time data
  const incomeOverTimeData = useMemo(() => {
    if (!incomeSources.length) return [];

    const dataPoints: Array<{ name: string; value: number }> = [];

    if (timeView === "week") {
      // Last 7 days - show daily income estimate
      const dailyIncome = totalMonthlyIncome / 30;
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dataPoints.push({
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          value: Math.round(dailyIncome),
        });
      }
    } else if (timeView === "month") {
      // Last 4 weeks
      const weeklyIncome = totalMonthlyIncome / 4;
      for (let i = 1; i <= 4; i++) {
        dataPoints.push({
          name: `Week ${i}`,
          value: Math.round(weeklyIncome),
        });
      }
    } else {
      // Last 12 months
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        dataPoints.push({
          name: date.toLocaleDateString("en-US", { month: "short" }),
          value: totalMonthlyIncome,
        });
      }
    }

    return dataPoints;
  }, [totalMonthlyIncome, timeView, incomeSources.length]);

  // Prepare category breakdown data
  const categoryData = useMemo(() => {
    if (!incomeSources.length) return [];

    return incomeSources.map((source) => {
      const amount = source.amount || 0;
      const percentage =
        totalMonthlyIncome > 0 ? (amount / totalMonthlyIncome) * 100 : 0;

      return {
        id: source.id,
        name: source.name || "Unnamed Source",
        amount: amount,
        percentage: Math.round(percentage),
        subtitle: `Payday: Day ${source.paydayDay}`,
        icon: Briefcase,
        color: "var(--primary)",
      };
    });
  }, [incomeSources, totalMonthlyIncome]);

  // Calculate next payday
  const nextPayday = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const paydays = incomeSources
      .map((source) => {
        let paydayDate: Date;

        if (source.paydayMonth !== undefined) {
          // Annual income source
          paydayDate = new Date(
            currentYear,
            source.paydayMonth,
            source.paydayDay
          );
          // If the payday has passed this year, set it for next year
          if (paydayDate < now) {
            paydayDate = new Date(
              currentYear + 1,
              source.paydayMonth,
              source.paydayDay
            );
          }
        } else {
          // Monthly income source
          paydayDate = new Date(currentYear, currentMonth, source.paydayDay);
          // If the payday has passed this month, set it for next month
          if (currentDay >= source.paydayDay) {
            paydayDate = new Date(
              currentYear,
              currentMonth + 1,
              source.paydayDay
            );
          }
        }

        return paydayDate;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    return paydays.length > 0 ? paydays[0] : null;
  }, [incomeSources]);

  // Calculate days until next payday
  const daysUntilPayday = useMemo(() => {
    if (!nextPayday) return null;
    const now = new Date();
    const diffTime = nextPayday.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [nextPayday]);

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
        Error loading income analytics
      </div>
    );
  }

  if (!incomeSources.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Income to Analyze</h3>
          <p className="text-sm text-muted-foreground">
            Add your first income source to see analytics and track your
            earnings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics - Horizontal Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card rounded-lg border p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <p className="text-base sm:text-xl font-bold">
            KSh {(totalMonthlyIncome / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {incomeSources.length} source{incomeSources.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Next Payday</p>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <p className="text-base sm:text-xl font-bold">
            {nextPayday
              ? nextPayday.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "Not set"}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {daysUntilPayday !== null
              ? `${daysUntilPayday} day${daysUntilPayday !== 1 ? "s" : ""}`
              : "Add payday"}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Daily Average</p>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-xl font-bold">
            KSh {(Math.round(totalMonthlyIncome / 30) / 1000).toFixed(1)}k
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Per day estimate
          </p>
        </div>
      </div>

      {/* Tabs for Analytics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">
            <BarChart3 className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <PieChart className="h-4 w-4 mr-2" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Income Over Time</CardTitle>
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
                  <BarChart data={incomeOverTimeData}>
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
                  <LineChart data={incomeOverTimeData}>
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
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown items={categoryData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
