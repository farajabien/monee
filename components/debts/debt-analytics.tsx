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
import { CreditCard, TrendingDown, Calendar, DollarSign } from "lucide-react";
import db from "@/lib/db";

type TimeView = "week" | "month" | "year";

export function DebtAnalytics() {
  const [timeView, setTimeView] = useState<TimeView>("month");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      debts: {
        payments: {},
      },
    },
  });

  const profile = data?.profiles?.[0];
  const debts = profile?.debts || [];

  // Chart config for Shadcn charts
  const chartConfig = {
    value: {
      label: "Debt Remaining",
      color: "hsl(var(--destructive))",
    },
  } satisfies ChartConfig;

  // Calculate total debt
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);

  // Calculate total paid
  const totalPaid = debts.reduce((sum, debt) => {
    const debtPayments = debt.payments || [];
    const paid = debtPayments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
    return sum + paid;
  }, 0);

  // Calculate remaining debt
  const remainingDebt = totalDebt - totalPaid;

  // Prepare debt reduction over time data
  const debtOverTimeData = useMemo(() => {
    if (!debts.length) return [];

    // Get all payment dates
    const allPayments: Array<{ date: number; amount: number }> = [];
    debts.forEach((debt) => {
      debt.payments?.forEach((payment) => {
        allPayments.push({
          date: payment.paymentDate || payment.createdAt,
          amount: payment.amount || 0,
        });
      });
    });

    // Sort by date
    allPayments.sort((a, b) => a.date - b.date);

    // Calculate debt over time
    let currentDebt = totalDebt;
    const dataPoints = [{ name: "Start", value: totalDebt }];

    if (timeView === "week") {
      // Last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = date.setHours(0, 0, 0, 0);
        const dayEnd = date.setHours(23, 59, 59, 999);

        const dayPayments = allPayments.filter(
          (p) => p.date >= dayStart && p.date <= dayEnd
        );
        const dayTotal = dayPayments.reduce((sum, p) => sum + p.amount, 0);
        currentDebt -= dayTotal;

        dataPoints.push({
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          value: Math.max(0, currentDebt),
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

        const weekPayments = allPayments.filter(
          (p) => p.date >= weekStart.getTime() && p.date < weekEnd.getTime()
        );
        const weekTotal = weekPayments.reduce((sum, p) => sum + p.amount, 0);
        currentDebt -= weekTotal;

        dataPoints.push({
          name: week,
          value: Math.max(0, currentDebt),
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

        const monthPayments = allPayments.filter(
          (p) => p.date >= monthStart && p.date <= monthEnd
        );
        const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        currentDebt -= monthTotal;

        dataPoints.push({
          name: month.name,
          value: Math.max(0, currentDebt),
        });
      });
    }

    return dataPoints;
  }, [debts, totalDebt, timeView]);

  // Prepare category breakdown data
  const categoryData = useMemo(() => {
    if (!debts.length) return [];

    return debts.map((debt) => {
      const paid =
        debt.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const remaining = (debt.amount || 0) - paid;
      const percentage = totalDebt > 0 ? (remaining / totalDebt) * 100 : 0;

      return {
        id: debt.id,
        name: debt.creditorName || "Unknown Debt",
        amount: remaining,
        percentage: Math.round(percentage),
        subtitle: `Paid: KSh ${paid.toLocaleString()}`,
        icon: CreditCard,
        color: "#ef4444", // red color for debts
      };
    }).filter((item) => item.amount > 0);
  }, [debts, totalDebt]);

  // Calculate average monthly payment
  const avgMonthlyPayment = useMemo(() => {
    const allPayments = debts.flatMap((d) => d.payments || []);
    if (!allPayments.length) return 0;

    // Group by month
    const monthlyTotals = new Map<string, number>();
    allPayments.forEach((payment) => {
      const date = new Date(payment.paymentDate || payment.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) || 0) + (payment.amount || 0)
      );
    });

    const total = Array.from(monthlyTotals.values()).reduce(
      (sum, val) => sum + val,
      0
    );
    return monthlyTotals.size > 0 ? total / monthlyTotals.size : 0;
  }, [debts]);

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
        Error loading debt analytics
      </div>
    );
  }

  if (!debts.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Debts to Analyze</h3>
          <p className="text-sm text-muted-foreground">
            Add your first debt to see analytics and track your progress.
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
            <CardTitle className="text-sm font-medium">
              Remaining Debt
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {remainingDebt.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {debts.length} active debt{debts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDebt > 0
                ? `${Math.round((totalPaid / totalDebt) * 100)}% paid off`
                : "0% paid off"}
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
              KSh {Math.round(avgMonthlyPayment).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Payment per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Debt Reduction Over Time</CardTitle>
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
              <BarChart data={debtOverTimeData}>
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
              <LineChart data={debtOverTimeData}>
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

      {/* Debt Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown items={categoryData} />
        </CardContent>
      </Card>
    </div>
  );
}
