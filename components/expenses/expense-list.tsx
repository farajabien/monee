"use client";

import { useMemo, useState } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { createExpenseListConfig } from "./expense-list-config";
import { ExpenseImportOrchestrator } from "./expense-import-orchestrator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipientList } from "@/components/recipients/recipient-list";
import { id } from "@instantdb/react";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
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
import { Button } from "@/components/ui/button";
import { ChevronLeft, RepeatIcon } from "lucide-react";
import type { Expense } from "@/types";
import { useCurrency } from "@/hooks/use-currency";

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
  const [activeView, setActiveView] = useState<
    "list" | "recipients" | "analytics"
  >("list");
  const [analyticsView, setAnalyticsView] = useState<
    "overview" | "day" | "category" | "recipients"
  >("overview");

  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      expenses: {
        $: {
          order: { createdAt: "desc" },
          limit: 50,
        },
      },
      recipients: {},
      recurringTransactions: {},
    },
  });

  const profile = data?.profiles?.[0];
  const expenses = useMemo(() => profile?.expenses || [], [profile?.expenses]);
  const recipients = useMemo(
    () => profile?.recipients || [],
    [profile?.recipients]
  );
  const recurringTransactions = useMemo(
    () => profile?.recurringTransactions || [],
    [profile?.recurringTransactions]
  );

  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

  // Get all available categories from existing expenses
  const categories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category).filter(Boolean));
    return Array.from(cats);
  }, [expenses]);

  // Handle saving imported expenses
  const handleSaveExpenses = async (
    importedExpenses: Array<Expense & { id?: string }>
  ) => {
    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    try {
      const txs = importedExpenses.map((expense) => {
        const expenseId = expense.id || id();
        return db.tx.expenses[expenseId]
          .update(expense)
          .link({ profile: profile.id });
      });

      await db.transact(txs);
      toast.success(`Successfully imported ${importedExpenses.length} expenses`);
    } catch (error) {
      console.error("Failed to save expenses:", error);
      throw error;
    }
  };

  // Create configuration with recipients for display name resolution
  const config = useMemo(() => {
    // Add recurring indicator to card rendering
    const baseConfig = createExpenseListConfig(recipients, formatCurrency);
    
    // Override renderListItem to add recurring indicator
    const originalRenderListItem = baseConfig.renderListItem;
    baseConfig.renderListItem = (item, index, actions) => {
      const isRecurring = item.isRecurring || item.linkedRecurringId;
      const originalCard = originalRenderListItem(item, index, actions);
      
      // Add recurring badge to the card
      if (isRecurring) {
        return (
          <div className="relative">
            {originalCard}
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <RepeatIcon className="h-3 w-3" />
                <span>Recurring</span>
              </div>
            </div>
          </div>
        );
      }
      
      return originalCard;
    };

    return baseConfig;
  }, [recipients, formatCurrency]);

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
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  // Create chart config for category pie chart
  const categoryChartConfig = useMemo(() => {
    if (!analytics?.categoryChartData) return {};

    const config: ChartConfig = {};
    analytics.categoryChartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [analytics]);

  // Main view navigation
  if (activeView === "list") {
    return (
      <div className="space-y-4">
        <Tabs value="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Expenses</TabsTrigger>
            <TabsTrigger
              value="recipients"
              onClick={() => setActiveView("recipients")}
            >
              Recipients
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              onClick={() => setActiveView("analytics")}
            >
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <UnifiedListContainer<Expense>
          config={config}
          data={expenses}
          editDialog={EditExpenseDialogAdapter}
          headerActions={
            profile ? (
              <ExpenseImportOrchestrator
                existingExpenses={expenses}
                recurringExpenses={recurringTransactions}
                categories={categories}
                onSaveExpenses={handleSaveExpenses}
              />
            ) : null
          }
        />
      </div>
    );
  }

  if (activeView === "recipients") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView("list")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Expenses
          </Button>
        </div>
        <RecipientList />
      </div>
    );
  }

  // Analytics view with sub-navigation
  if (activeView === "analytics") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView("list")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Expenses
          </Button>
        </div>

        {analytics ? (
          <>
            <Tabs
              value={analyticsView}
              onValueChange={(v) => setAnalyticsView(v as typeof analyticsView)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="day">By Day</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>
            </Tabs>

            {analyticsView === "overview" && (
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Total Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(analytics.totalAmount)}
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
                      {formatCurrency(analytics.avgAmount)}
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
                      {formatCurrency(analytics.highestExpense)}
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
                      {formatCurrency(analytics.lowestExpense)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {analyticsView === "day" && (
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
                        color: "var(--chart-1)",
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
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                formatCurrency(value as number)
                              }
                            />
                          }
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {analyticsView === "category" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <ChartContainer
                    config={categoryChartConfig}
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
                          nameKey="name"
                        >
                          {analytics.categoryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`var(--color-${entry.name})`}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                formatCurrency(value as number)
                              }
                              nameKey="name"
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {analyticsView === "recipients" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 10 Recipients</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Amount",
                        color: "var(--chart-2)",
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
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                formatCurrency(value as number)
                              }
                            />
                          }
                        />
                        <Bar dataKey="value" fill="var(--color-value)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No expense data available for analytics
          </div>
        )}
      </div>
    );
  }

  return null;
}
