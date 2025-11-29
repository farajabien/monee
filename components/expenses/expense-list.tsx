"use client";

import { useMemo, useState } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { createExpenseListConfig } from "./expense-list-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipientList } from "@/components/recipients/recipient-list";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/types";

// Wrapper component to adapt props
const EditExpenseDialogAdapter = ({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Expense | null;
}) => {
  return (
    <EditExpenseDialog open={open} onOpenChange={onOpenChange} expense={item} />
  );
};

export default function ExpenseList() {
  const user = db.useUser();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
        limit: 50,
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const recipients = useMemo(() => data?.recipients || [], [data?.recipients]);

  // Create configuration with recipients for display name resolution
  const config = useMemo(
    () => createExpenseListConfig(recipients),
    [recipients]
  );

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!expenses.length) return null;

    // By Category
    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryChartData = Object.entries(categoryData).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    // By Recipient
    const recipientData = expenses.reduce((acc, expense) => {
      const recipientName = expense.recipient || "Unknown";
      const savedRecipient = recipients.find(
        (r) => r.originalName === recipientName
      );
      const displayName = savedRecipient?.nickname || recipientName;
      acc[displayName] = (acc[displayName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const recipientChartData = Object.entries(recipientData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // By Day of Week
    const dayData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      acc[dayName] = (acc[dayName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayChartData = dayOrder.map((day) => ({
      day,
      amount: dayData[day] || 0,
    }));

    // Stats
    const amounts = expenses.map((e) => e.amount);
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
    const avgAmount = totalAmount / amounts.length;
    const highestExpense = Math.max(...amounts);
    const lowestExpense = Math.min(...amounts);

    return {
      categoryChartData,
      recipientChartData,
      dayChartData,
      totalAmount,
      avgAmount,
      highestExpense,
      lowestExpense,
    };
  }, [expenses, recipients]);

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="expenses">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list">Expense List</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <UnifiedListContainer<Expense>
              config={config}
              data={expenses}
              editDialog={EditExpenseDialogAdapter}
            />
          </TabsContent>

          <TabsContent value="recipients">
            <RecipientList />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="analytics">
        {analytics ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    KES {analytics.totalAmount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Avg Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    KES {analytics.avgAmount.toFixed(0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Highest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    KES {analytics.highestExpense.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Lowest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    KES {analytics.lowestExpense.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spending by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Spending by Day of Week
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[250px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.dayChartData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ChartContainer
                  config={{
                    value: {
                      label: "Amount",
                    },
                  }}
                  className="h-[250px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.categoryChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 10 Recipients</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ChartContainer
                  config={{
                    value: {
                      label: "Amount",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.recipientChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No expense data available for analytics
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
