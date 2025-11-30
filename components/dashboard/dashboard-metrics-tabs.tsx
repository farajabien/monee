"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { TrendingUp, PieChartIcon, BarChart3, Target, Wallet } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  recipient: string;
  date: number;
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface DashboardMetricsTabsProps {
  expenses: Expense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  userCurrency?: string;
  userLocale?: string;
}

const CHART_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#22c55e", // green
  "#a3a3a3", // gray
  "#ef4444", // red
  "#eab308", // yellow
];

export function DashboardMetricsTabs({
  expenses,
  debts,
  savingsGoals,
  userCurrency,
  userLocale,
}: DashboardMetricsTabsProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency(
    userCurrency,
    userLocale
  );

  // Category spending data
  const categoryData = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Top 5 expenses
  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((exp) => ({
        name: exp.recipient,
        amount: exp.amount,
      }));
  }, [expenses]);

  // Debts data
  const debtsData = useMemo(() => {
    return debts.map((debt) => ({
      name: debt.name,
      remaining: debt.currentBalance,
      total: debt.totalAmount,
      progress: ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100,
    }));
  }, [debts]);

  // Savings data
  const savingsData = useMemo(() => {
    return savingsGoals.map((goal) => ({
      name: goal.name,
      current: goal.currentAmount,
      target: goal.targetAmount,
      progress: (goal.currentAmount / goal.targetAmount) * 100,
    }));
  }, [savingsGoals]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="spending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
            <TabsTrigger value="spending" className="text-xs">
              <PieChartIcon className="h-3 w-3 mr-1" />
              Spending
            </TabsTrigger>
            <TabsTrigger value="top" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Top 5
            </TabsTrigger>
            <TabsTrigger value="debts" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Debts
            </TabsTrigger>
            <TabsTrigger value="savings" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" />
              Savings
            </TabsTrigger>
          </TabsList>

          {/* Spending Breakdown - Pie Chart */}
          <TabsContent value="spending" className="p-4 space-y-3">
            {categoryData.length > 0 ? (
              <>
                <ChartContainer
                  config={{}}
                  className="h-[200px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
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
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{payload[0].name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="space-y-2">
                  {categoryData.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrencyCompact(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No spending data yet
              </div>
            )}
          </TabsContent>

          {/* Top 5 Expenses - Bar Chart */}
          <TabsContent value="top" className="p-4">
            {topExpenses.length > 0 ? (
              <ChartContainer
                config={{}}
                className="h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topExpenses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No expenses yet
              </div>
            )}
          </TabsContent>

          {/* Debts Progress */}
          <TabsContent value="debts" className="p-4 space-y-3">
            {debtsData.length > 0 ? (
              debtsData.map((debt) => (
                <div key={debt.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{debt.name}</span>
                    <span className="text-muted-foreground">
                      {debt.progress.toFixed(0)}% paid
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(debt.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrencyCompact(debt.remaining)} remaining</span>
                    <span>{formatCurrencyCompact(debt.total)} total</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No debts tracked yet
              </div>
            )}
          </TabsContent>

          {/* Savings Progress */}
          <TabsContent value="savings" className="p-4 space-y-3">
            {savingsData.length > 0 ? (
              savingsData.map((goal) => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground">
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrencyCompact(goal.current)} saved</span>
                    <span>{formatCurrencyCompact(goal.target)} target</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No savings goals yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
