"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  ArrowRight,
  Users,
} from "lucide-react";
import type { Expense } from "@/types";

export function YearInReview() {
  const user = db.useUser();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: { "user.id": user.id },
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
        where: { "user.id": user.id },
      },
    },
    debts: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const expenses = data?.expenses || [];
  const recipients = data?.recipients || [];
  const categories = data?.categories || [];
  const budgets = data?.budgets || [];
  const debts = data?.debts || [];

  // Filter for 2025 expenses
  const year2025Transactions = useMemo(() => {
    return expenses.filter((t: Expense) => {
      const date = new Date(t.date || t.createdAt);
      return date.getFullYear() === 2025;
    });
  }, [expenses]);

  // Calculate year stats
  const yearStats = useMemo(() => {
    if (year2025Transactions.length === 0) return null;

    const totalSpent = year2025Transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Top recipient
    const recipientMap = new Map<string, { amount: number; count: number }>();
    year2025Transactions.forEach((t: Expense) => {
      if (t.recipient) {
        const current = recipientMap.get(t.recipient) || {
          amount: 0,
          count: 0,
        };
        recipientMap.set(t.recipient, {
          amount: current.amount + t.amount,
          count: current.count + 1,
        });
      }
    });

    let topRecipient = { name: "Unknown", amount: 0, count: 0 };
    recipientMap.forEach((data, name) => {
      if (data.amount > topRecipient.amount) {
        const recipient = recipients.find((r) => r.originalName === name);
        topRecipient = {
          name: recipient?.nickname || name,
          ...data,
        };
      }
    });

    // Monthly spending
    const monthlyMap = new Map<string, number>();
    year2025Transactions.forEach((t: Expense) => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = date.toLocaleDateString("en-US", { month: "long" });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
    });

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    const mostExpensiveMonth = monthlySpending.reduce(
      (max, curr) => (curr.amount > max.amount ? curr : max),
      { month: "", amount: 0 }
    );

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    year2025Transactions.forEach((t: Expense) => {
      const category = t.category || "Uncategorized";
      const current = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: current.amount + t.amount,
        count: current.count + 1,
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const avgTransaction = totalSpent / year2025Transactions.length;
    const firstTransaction = new Date(
      Math.min(
        ...year2025Transactions.map((t: Expense) => t.date || t.createdAt)
      )
    );
    const lastTransaction = new Date(
      Math.max(
        ...year2025Transactions.map((t: Expense) => t.date || t.createdAt)
      )
    );

    return {
      totalSpent,
      totalTransactions: year2025Transactions.length,
      topRecipient,
      monthlySpending,
      mostExpensiveMonth,
      topCategories,
      avgTransaction,
      firstTransaction,
      lastTransaction,
      totalRecipients: recipientMap.size,
      totalCategories: categories.length,
      totalBudgets: budgets.filter((b: { month: number }) => {
        const date = new Date(b.month);
        return date.getFullYear() === 2025;
      }).length,
      debtsCleared: debts.filter(
        (d: { currentBalance: number }) => d.currentBalance === 0
      ).length,
    };
  }, [year2025Transactions, recipients, categories, budgets, debts]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!yearStats || yearStats.totalTransactions === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No 2025 Data Yet</h3>
          <p className="text-muted-foreground">
            Add expenses from 2025 to see your year-in-review insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Your 2025 Financial Year in Review 🇰🇪
          </CardTitle>
          <CardDescription>
            A comprehensive look at your money journey this year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(yearStats.totalSpent)}
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Expenses</p>
              <p className="text-2xl font-bold">
                {yearStats.totalTransactions}
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Avg Expense</p>
              <p className="text-2xl font-bold text-green-500">
                {formatAmount(yearStats.avgTransaction)}
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Recipients</p>
              <p className="text-2xl font-bold text-blue-500">
                {yearStats.totalRecipients}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recipient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Your #1 Recipient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-yellow-500/10 rounded-lg">
              <p className="text-xl font-bold mb-2">
                {yearStats.topRecipient.name}
              </p>
              <p className="text-3xl font-bold text-yellow-500">
                {formatAmount(yearStats.topRecipient.amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {yearStats.topRecipient.count} expenses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Most Expensive Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Most Expensive Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-red-500/10 rounded-lg">
              <p className="text-xl font-bold mb-2">
                {yearStats.mostExpensiveMonth.month}
              </p>
              <p className="text-3xl font-bold text-red-500">
                {formatAmount(yearStats.mostExpensiveMonth.amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Your biggest spending month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Spending Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {yearStats.monthlySpending.map((month) => (
              <div key={month.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{month.month}</span>
                  <span className="text-muted-foreground">
                    {formatAmount(month.amount)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{
                      width: `${(month.amount / yearStats.totalSpent) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Top Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearStats.topCategories.map((cat) => (
              <div key={cat.category} className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">{cat.category}</p>
                <p className="text-2xl font-bold">{formatAmount(cat.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.count} expenses
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            2025 Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold mb-1">
                {yearStats.totalCategories}
              </p>
              <p className="text-xs text-muted-foreground">
                Categories Tracked
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold mb-1">
                {yearStats.totalBudgets}
              </p>
              <p className="text-xs text-muted-foreground">Budgets Created</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold mb-1">
                {yearStats.debtsCleared}
              </p>
              <p className="text-xs text-muted-foreground">Debts Cleared</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold mb-1">
                {yearStats.totalRecipients}
              </p>
              <p className="text-xs text-muted-foreground">Unique Recipients</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Your 2025 Money Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">First Expense</p>
              <p className="font-medium">
                {yearStats.firstTransaction.toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Last Expense</p>
              <p className="font-medium">
                {yearStats.lastTransaction.toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
