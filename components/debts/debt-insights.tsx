"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ResponsiveContainer,
} from "recharts";
import {
  CreditCard,
  ChevronLeft,
  TrendingDown,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import db from "@/lib/db";
import { useCurrency } from "@/hooks/use-currency";
import { CategoryBreakdown } from "@/components/charts/category-breakdown";

type TimeView = "week" | "month" | "year";

interface DebtInsightsProps {
  onBack: () => void;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function DebtInsights({ onBack }: DebtInsightsProps) {
  const [insightsView, setInsightsView] = useState<"overview" | "timeline">(
    "overview"
  );
  const [timeView, setTimeView] = useState<TimeView>("month");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const { formatCurrency } = useCurrency();

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      debts: {
        payments: {},
      },
    },
  });

  const profile = data?.profiles?.[0];
  const debts = useMemo(() => profile?.debts || [], [profile?.debts]);

  // Calculate total debt (using currentBalance as the original debt amount)
  const totalDebt = useMemo(
    () =>
      debts.reduce(
        (sum, debt) => sum + (debt.debtTaken || debt.currentBalance || 0),
        0
      ),
    [debts]
  );

  // Calculate total paid
  const totalPaid = useMemo(() => {
    return debts.reduce((sum, debt) => {
      const debtPayments = debt.payments || [];
      const paid = debtPayments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
      return sum + paid;
    }, 0);
  }, [debts]);

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
  const breakdownData = useMemo(() => {
    if (!debts.length) return [];

    return debts
      .map((debt) => {
        const paid =
          debt.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const originalAmount = debt.debtTaken || debt.currentBalance || 0;
        const remaining = originalAmount - paid;

        return {
          name: debt.debtor || "Unknown Debt",
          value: remaining,
        };
      })
      .filter((item) => item.value > 0);
  }, [debts]);

  // Prepare category breakdown items for CategoryBreakdown component
  const categoryBreakdownItems = useMemo(() => {
    if (!breakdownData.length) return [];

    const total = breakdownData.reduce((sum, item) => sum + item.value, 0);

    return breakdownData.map((item, index) => ({
      id: item.name,
      name: item.name,
      amount: item.value,
      percentage: Math.round((item.value / total) * 100),
      icon: CreditCard,
      color: COLORS[index % COLORS.length],
    }));
  }, [breakdownData]);

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

  // Create chart config for breakdown pie chart
  const breakdownChartConfig = useMemo(() => {
    if (!debts.length) return {};

    const config: ChartConfig = {};
    debts.forEach((debt, index) => {
      const debtName = debt.debtor || "Unknown Debt";
      config[debtName] = {
        label: debtName,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
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
        Error loading debt insights
      </div>
    );
  }

  if (!debts.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Debts
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Debts to Analyze</h3>
            <p className="text-sm text-muted-foreground">
              Add your first debt to see insights and track your progress.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Debts
        </Button>
      </div>

      <Tabs
        value={insightsView}
        onValueChange={(v) => setInsightsView(v as typeof insightsView)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
      </Tabs>

      {insightsView === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg border p-3">
            <div className="flex flex-col items-center text-center">
              <TrendingDown className="h-5 w-5 text-destructive mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-lg font-bold leading-tight">
                {formatCurrency(remainingDebt)}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-lg font-bold leading-tight">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Avg Mo.</p>
              <p className="text-lg font-bold leading-tight">
                {formatCurrency(avgMonthlyPayment)}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex flex-col items-center text-center">
              <CreditCard className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Active</p>
              <p className="text-lg font-bold leading-tight">{debts.length}</p>
            </div>
          </div>
        </div>
      )}

      {insightsView === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Debt Reduction Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {/* Time View Selector */}
            <div className="flex justify-center gap-2 mb-4">
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

            {/* Chart Type Selector */}
            <div className="flex justify-center gap-2 mb-4">
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

            {/* Chart */}
            <ChartContainer
              config={{
                value: {
                  label: "Debt Remaining",
                  color: "var(--chart-1)",
                },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={debtOverTimeData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart
                    data={debtOverTimeData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-value)", r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
