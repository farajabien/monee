"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";

interface StatsViewProps {
  profileId?: string;
}

type Period = "weekly" | "monthly" | "annually";

export function StatsView({ profileId }: StatsViewProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "annually">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("expenses-income");

  // Fetch profile for currency preference
  const { data: profileData } = db.useQuery(
    profileId
      ? {
          profiles: {
            $: {
              where: {
                id: profileId,
              },
            },
          },
        }
      : null
  );

  const userCurrency = profileData?.profiles?.[0]?.currency || DEFAULT_CURRENCY;

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date(currentDate);
    let start: Date, end: Date;

    if (period === "weekly") {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return { start: start.getTime(), end: end.getTime() };
  };

  const { start, end } = getDateRange();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: start, $lte: end },
        },
      },
    },
    income: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: start, $lte: end },
        },
      },
    },
    debts: {
      $: {
        where: {
          profile: profileId,
        },
      },
    },
    wishlist: {
      $: {
        where: {
          profile: profileId,
        },
      },
    },
  });

  const expenses = data?.expenses || [];
  const income = data?.income || [];
  const debts = data?.debts || [];
  const wishlist = data?.wishlist || [];

  // Calculate totals
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group expenses by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
  });

  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0",
    }));

  // Debt statistics
  const iOwe = debts.filter((d) => d.direction === "I_OWE" && d.status === "pending");
  const theyOweMe = debts.filter((d) => d.direction === "THEY_OWE_ME" && d.status === "pending");
  const totalIOwe = iOwe.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalTheyOweMe = theyOweMe.reduce((sum, d) => sum + (d.currentBalance || 0), 0);

  // ELTIW statistics
  const wantItems = wishlist.filter((w) => w.status === "want");
  const gotItems = wishlist.filter((w) => w.status === "got");
  const wantTotal = wantItems.reduce((sum, w) => sum + (w.amount || 0), 0);
  const gotTotal = gotItems.reduce((sum, w) => sum + (w.amount || 0), 0);

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (period === "weekly") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (period === "monthly") {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setFullYear(currentDate.getFullYear() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDisplayDate = () => {
    if (period === "weekly") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      return `Week ${Math.ceil(currentDate.getDate() / 7)}, ${currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
    } else if (period === "monthly") {
      return currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  // Color palette for categories
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];

  return (
    <div className="pb-4">
      {/* Header with Period Navigation */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">{getDisplayDate()}</h2>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Period Selector */}
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses-income" className="text-xs">Expenses & Income</TabsTrigger>
            <TabsTrigger value="debts" className="text-xs">Debts</TabsTrigger>
            <TabsTrigger value="eltiw" className="text-xs">ELTIW</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      {activeTab === "expenses-income" && (
        <div className="p-4 space-y-4">
          {/* Income/Expense Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-3 rounded bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(totalIncome, userCurrency)}</p>
            </div>
            <div className="text-center p-3 rounded bg-red-50 dark:bg-red-900/20">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-600">{formatCurrency(totalExpenses, userCurrency)}</p>
            </div>
          </div>

          {sortedCategories.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Expense Breakdown</h3>

              {/* Stacked Bar */}
              <div className="h-8 rounded-full overflow-hidden flex">
                {sortedCategories.map((item, idx) => (
                  <div
                    key={item.category}
                    className={`${colors[idx % colors.length]} transition-all`}
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.category}: ${item.percentage}%`}
                  />
                ))}
              </div>

              {/* Category List */}
              <div className="space-y-2 mt-4">
                {sortedCategories.map((item, idx) => (
                  <Card key={item.category} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-6 h-6 rounded ${colors[idx % colors.length]}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm ml-2">
                        {formatCurrency(item.amount, userCurrency)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expense data for this period
            </div>
          )}
        </div>
      )}

      {activeTab === "debts" && (
        <div className="p-4 space-y-4">
          {/* Debt Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-3 rounded bg-red-50 dark:bg-red-900/20">
              <p className="text-xs text-muted-foreground">I Owe</p>
              <p className="font-semibold text-red-600">{formatCurrency(totalIOwe, userCurrency)}</p>
              <p className="text-xs text-muted-foreground mt-1">{iOwe.length} {iOwe.length === 1 ? 'debt' : 'debts'}</p>
            </div>
            <div className="text-center p-3 rounded bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground">They Owe Me</p>
              <p className="font-semibold text-green-600">{formatCurrency(totalTheyOweMe, userCurrency)}</p>
              <p className="text-xs text-muted-foreground mt-1">{theyOweMe.length} {theyOweMe.length === 1 ? 'debt' : 'debts'}</p>
            </div>
          </div>

          {/* Net Position */}
          <div className="text-center p-4 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">Net Position</p>
            <p className={`text-xl font-bold ${totalTheyOweMe - totalIOwe >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalTheyOweMe - totalIOwe), userCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTheyOweMe - totalIOwe >= 0 ? 'You are owed more' : 'You owe more'}
            </p>
          </div>

          {/* Breakdown by Person */}
          {debts.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Breakdown by Person</h3>
              {debts.filter(d => d.status === "pending").map((debt) => (
                <Card key={debt.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{debt.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        {debt.direction === "I_OWE" ? "You owe" : "They owe you"}
                      </p>
                    </div>
                    <p className={`font-semibold ${debt.direction === "I_OWE" ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(debt.currentBalance || 0, userCurrency)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending debts
            </div>
          )}
        </div>
      )}

      {activeTab === "eltiw" && (
        <div className="p-4 space-y-4">
          {/* ELTIW Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-3 rounded bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs text-muted-foreground">Want</p>
              <p className="font-semibold text-purple-600">{formatCurrency(wantTotal, userCurrency)}</p>
              <p className="text-xs text-muted-foreground mt-1">{wantItems.length} {wantItems.length === 1 ? 'item' : 'items'}</p>
            </div>
            <div className="text-center p-3 rounded bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground">Got</p>
              <p className="font-semibold text-green-600">{formatCurrency(gotTotal, userCurrency)}</p>
              <p className="text-xs text-muted-foreground mt-1">{gotItems.length} {gotItems.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>

          {/* Savings Gap */}
          <div className="text-center p-4 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">Savings Gap</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(wantTotal, userCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total needed for wishlist items
            </p>
          </div>

          {/* Items List */}
          {wishlist.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">All Items</h3>
              {wishlist.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.status === "got" ? "✓ Got it" : "Want"}
                      </p>
                    </div>
                    {item.amount && (
                      <p className={`font-semibold ${item.status === "got" ? 'text-green-600' : 'text-purple-600'}`}>
                        {formatCurrency(item.amount, userCurrency)}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No wishlist items yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
