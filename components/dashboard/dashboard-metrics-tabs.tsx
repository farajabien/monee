"use client";

import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
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
} from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import {
  PieChartIcon,
  BarChart3,
  Target,
  Wallet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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

  // Chart config for category data
  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categoryData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [categoryData]);

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

  // Chart config for top expenses
  const topExpensesChartConfig = {
    amount: {
      label: "Amount",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Debts data
  const debtsData = useMemo(() => {
    return debts.map((debt) => ({
      name: debt.name,
      remaining: debt.currentBalance,
      total: debt.totalAmount,
      progress:
        ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100,
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

  // Export functions
  const handleExportSpending = () => {
    try {
      const csvContent = [
        ["Category", "Amount"].join(","),
        ...categoryData.map((item) =>
          [item.name, item.value].map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spending-breakdown-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Spending data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export spending data");
    }
  };

  const handleExportTopExpenses = () => {
    try {
      const csvContent = [
        ["Recipient", "Amount"].join(","),
        ...topExpenses.map((item) =>
          [item.name, item.amount].map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `top-expenses-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Top expenses exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export top expenses");
    }
  };

  const handleExportDebts = () => {
    try {
      const csvContent = [
        ["Debt Name", "Total Amount", "Remaining", "Progress %"].join(","),
        ...debtsData.map((debt) =>
          [debt.name, debt.total, debt.remaining, debt.progress.toFixed(2)]
            .map((cell) => `"${cell}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debts-progress-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Debts data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export debts data");
    }
  };

  const handleExportSavings = () => {
    try {
      const csvContent = [
        ["Goal Name", "Target Amount", "Current Amount", "Progress %"].join(
          ","
        ),
        ...savingsData.map((goal) =>
          [goal.name, goal.target, goal.current, goal.progress.toFixed(2)]
            .map((cell) => `"${cell}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `savings-goals-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Savings data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export savings data");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Spending Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Spending Breakdown
        </h3>
        {categoryData.length > 0 ? (
          <>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSpending}
                className="h-8 text-xs"
              >
                <Download className="size-3 mr-1" />
                Export CSV
              </Button>
            </div>
            <ChartContainer
              config={categoryChartConfig}
              className="min-h-[200px] w-full"
            >
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
                  nameKey="name"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`var(--color-${entry.name})`}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                      nameKey="name"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {categoryData.slice(0, 5).map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-sm"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
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
      </div>

      {/* Section 2: Top 5 Expenses */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Top 5 Expenses
        </h3>
        {topExpenses.length > 0 ? (
          <>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTopExpenses}
                className="h-8 text-xs"
              >
                <Download className="size-3 mr-1" />
                Export CSV
              </Button>
            </div>
            <ChartContainer
              config={topExpensesChartConfig}
              className="min-h-[250px] w-full"
            >
              <BarChart data={topExpenses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                      hideLabel
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No expenses yet
          </div>
        )}
      </div>

      {/* Section 3: Debts Progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          Debt Progress
        </h3>
        {debtsData.length > 0 ? (
          <>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDebts}
                className="h-8 text-xs"
              >
                <Download className="size-3 mr-1" />
                Export CSV
              </Button>
            </div>
            {debtsData.map((debt) => (
              <div key={debt.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{debt.name}</span>
                  <span className="text-muted-foreground">
                    {debt.progress.toFixed(0)}% paid
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-muted-foreground/60 transition-all"
                    style={{ width: `${Math.min(debt.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrencyCompact(debt.remaining)} remaining</span>
                  <span>{formatCurrencyCompact(debt.total)} total</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No debts tracked yet
          </div>
        )}
      </div>

      {/* Section 4: Savings Progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Savings Progress
        </h3>
        {savingsData.length > 0 ? (
          <>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSavings}
                className="h-8 text-xs"
              >
                <Download className="size-3 mr-1" />
                Export CSV
              </Button>
            </div>
            {savingsData.map((goal) => (
              <div key={goal.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-muted-foreground">
                    {goal.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-muted-foreground/60 transition-all"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrencyCompact(goal.current)} saved</span>
                  <span>{formatCurrencyCompact(goal.target)} target</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No savings goals yet
          </div>
        )}
      </div>
    </div>
  );
}
