"use client";

import db from "@/lib/db";
import { Card, CardContent} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import CategoryBadge from "../categories/category-badge";
import { RecipientManager } from "@/components/recipients/recipient-manager";
import type { Transaction, Category, Budget } from "@/types";

// Normalize recipient for grouping
function normalizeRecipient(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b0?\d{9,10}\b/g, "")
    .trim();
}

export default function MonthlySummary() {
  const user = db.useUser();

  // Get current month start and end timestamps
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );
  const monthStartTs = monthStart.getTime();
  const monthEndTs = monthEnd.getTime();

  // Get profile for monthly budget
  const { data: profileData } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const profile = profileData?.profiles?.[0];
  const monthlyBudget = profile?.monthlyBudget || 0;

  // Get this month's transactions, income sources, and debt payments
  const { isLoading, error, data } = db.useQuery({
    transactions: {
      $: {
        where: {
          "user.id": user.id,
          date: { $gte: monthStartTs, $lte: monthEndTs },
        },
        order: { date: "desc" },
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.id },
      },
    },
    categories: {
      $: {
        where: { "user.id": user.id },
      },
    },
    budgets: {
      $: {
        where: {
          "user.id": user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      category: {},
      user: {},
    },
    income_sources: {
      $: {
        where: { "user.id": user.id, isActive: true },
      },
      user: {},
    },
    debt_payments: {
      $: {
        where: {
          paymentDate: { $gte: monthStartTs, $lte: monthEndTs },
        },
      },
      debt: {
        user: {},
      },
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.transactions || [];
  const recipients = data?.recipients || [];
  const categories = data?.categories || [];
  const budgets = data?.budgets || [];
  const incomeSources = data?.income_sources || [];
  const debtPayments = data?.debt_payments || [];

  // Helper to get display name (nickname or original)
  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r) => r.originalName === originalName);
    return recipient?.nickname || originalName;
  };

  // Calculate monthly income from active sources
  const currentMonth = now.getMonth() + 1;
  const totalIncome = incomeSources.reduce((sum, source) => {
    // If paydayMonth is set, only include if it matches current month
    if (source.paydayMonth && source.paydayMonth !== currentMonth) {
      return sum;
    }
    return sum + source.amount;
  }, 0);

  // Calculate totals
  const totalSpent = transactions.reduce(
    (sum: number, tx: Transaction) => sum + tx.amount,
    0
  );

  // Calculate total debt payments this month (only for user's debts)
  const totalDebtPayments = debtPayments.reduce((sum, payment) => {
    if (payment.debt?.user?.id === user.id) {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  // Total expenses including debt payments
  const totalExpenses = totalSpent + totalDebtPayments;

  // Net balance
  const netBalance = totalIncome - totalExpenses;

  // Group by category
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  transactions.forEach((tx: Transaction) => {
    const cat = tx.category || "Uncategorized";
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { amount: 0, count: 0 };
    }
    categoryTotals[cat].amount += tx.amount;
    categoryTotals[cat].count += 1;
  });

  // Group by recipient (normalized)
  const recipientTotals: Record<string, { amount: number; count: number; displayName: string; originalName: string }> = {};
  transactions.forEach((tx: Transaction) => {
    if (!tx.recipient) return;
    const normalized = normalizeRecipient(tx.recipient);
    if (!normalized) return;
    
    if (!recipientTotals[normalized]) {
      recipientTotals[normalized] = { 
        amount: 0, 
        count: 0,
        displayName: getDisplayName(tx.recipient), // Use nickname if available
        originalName: tx.recipient
      };
    }
    recipientTotals[normalized].amount += tx.amount;
    recipientTotals[normalized].count += 1;
  });

  // Get budget for each category
  const categoryBudgets: Record<string, number> = {};
  budgets.forEach((budget: Budget) => {
    const category = categories.find(
      (c: Category) => c.id === budget.category?.id
    );
    if (category) {
      categoryBudgets[category.name] = budget.amount;
    }
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = () => {
    return now.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  };

  const budgetProgress =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  return (
     <div className="space-y-6">
          {/* Income vs Expenses */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Income</div>
              <div className="text-xl font-bold text-green-600">
                {formatAmount(totalIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Expenses</div>
              <div className="text-xl font-bold text-red-600">
                {formatAmount(totalExpenses)}
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Net Balance</span>
              <span
                className={`text-2xl font-bold ${
                  netBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatAmount(netBalance)}
              </span>
            </div>
            {totalDebtPayments > 0 && (
              <div className="text-xs text-muted-foreground">
                Includes {formatAmount(totalDebtPayments)} in debt payments
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Spent</span>
              <span className="text-2xl font-bold">
                {formatAmount(totalSpent)}
              </span>
            </div>
            {monthlyBudget > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Monthly Budget</span>
                  <span>{formatAmount(monthlyBudget)}</span>
                </div>
                <Progress
                  value={Math.min(budgetProgress, 100)}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {budgetProgress > 100
                      ? "Over budget"
                      : `${Math.round(budgetProgress)}% used`}
                  </span>
                  <span>
                    {formatAmount(Math.max(0, monthlyBudget - totalSpent))}{" "}
                    remaining
                  </span>
                </div>
              </>
            )}
          </div>

          {Object.keys(categoryTotals).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">By Category</h3>
              
              {/* Pie Chart */}
              <ChartContainer
                config={Object.fromEntries(
                  Object.keys(categoryTotals).map((name, index) => [
                    name,
                    {
                      label: name,
                      color: `hsl(var(--chart-${(index % 5) + 1}))`,
                    },
                  ])
                )}
                className="h-[300px] w-full"
              >
                <PieChart>
                  <Pie
                    data={Object.entries(categoryTotals)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([name, totals]) => ({
                        name,
                        value: totals.amount,
                        percentage: ((totals.amount / totalSpent) * 100).toFixed(1),
                      }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {Object.keys(categoryTotals).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatAmount(Number(value))}
                      />
                    }
                  />
                  <Legend />
                </PieChart>
              </ChartContainer>
              
              {/* List View */}
              <div className="space-y-2 mt-4">
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([categoryName, totals]) => {
                    const category = categories.find(
                      (c: Category) => c.name === categoryName
                    );
                    const budget = categoryBudgets[categoryName] || 0;
                    const categoryProgress =
                      budget > 0 ? (totals.amount / budget) * 100 : 0;

                    return (
                      <div key={categoryName} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {category ? (
                              <CategoryBadge category={category} />
                            ) : (
                              <Badge variant="secondary">{categoryName}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({totals.count} transaction
                              {totals.count !== 1 ? "s" : ""})
                            </span>
                          </div>
                          <span className="font-semibold">
                            {formatAmount(totals.amount)}
                          </span>
                        </div>
                        {budget > 0 && (
                          <Progress
                            value={Math.min(categoryProgress, 100)}
                            className="h-1"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {Object.keys(recipientTotals).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Top Recipients</h3>
              
              {/* Bar Chart */}
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={Object.entries(recipientTotals)
                    .sort((a, b) => b[1].amount - a[1].amount)
                    .slice(0, 8)
                    .map(([, totals]) => ({
                      name: totals.displayName.length > 15 
                        ? totals.displayName.slice(0, 15) + "..." 
                        : totals.displayName,
                      amount: totals.amount,
                      count: totals.count,
                    }))}
                  layout="vertical"
                  margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatAmount(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
              
              {/* List View */}
              <div className="space-y-2 mt-4">
                {Object.entries(recipientTotals)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .slice(0, 10) // Show top 10
                  .map(([normalized, totals]) => (
                    <div key={normalized} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm truncate">{totals.displayName}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({totals.count}×)
                        </span>
                        <RecipientManager
                          recipientName={totals.originalName}
                          compact
                        />
                      </div>
                      <span className="font-semibold shrink-0">
                        {formatAmount(totals.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No transactions this month yet.</p>
              <p className="text-sm mt-2">
                Start tracking your spending to see insights here!
              </p>
            </div>
          )}
        </div>
  );
}
