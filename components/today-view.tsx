"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";

interface TodayViewProps {
  profileId?: string;
}

export function TodayView({ profileId }: TodayViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("summary");
  
  // Get start and end of current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).getTime();

  // Fetch profile for currency preference
  const profileQuery = profileId
    ? {
        profiles: {
          $: {
            where: {
              id: profileId,
            },
          },
        },
      }
    : {};
  
  const { data: profileData } = db.useQuery(profileQuery as any);

  const userCurrency = (profileData as any)?.profiles?.[0]?.currency || DEFAULT_CURRENCY;

  const { data } = db.useQuery({
    income: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    expenses: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    debts: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    wishlist: {
      $: {
        where: {
          profile: profileId,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          createdAt: "desc",
        },
      },
    },
  });

  const income = data?.income || [];
  const expenses = data?.expenses || [];
  const debts = data?.debts || [];
  const wishlist = data?.wishlist || [];

  // Calculate month totals
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthTotal = totalIncome - totalExpenses;

  // Group transactions by day
  const transactionsByDay: Record<string, { income: any[]; expenses: any[]; debts: any[]; wishlist: any[] }> = {};

  [...income, ...expenses, ...debts, ...wishlist].forEach((item) => {
    const timestamp = "date" in item && item.date ? item.date : item.createdAt ?? Date.now();
    const date = new Date(timestamp);
    const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    if (!transactionsByDay[dayKey]) {
      transactionsByDay[dayKey] = { income: [], expenses: [], debts: [], wishlist: [] };
    }

    if ("source" in item) {
      transactionsByDay[dayKey].income.push(item);
    } else if ("recipient" in item) {
      transactionsByDay[dayKey].expenses.push(item);
    } else if ("personName" in item) {
      transactionsByDay[dayKey].debts.push(item);
    } else {
      transactionsByDay[dayKey].wishlist.push(item);
    }
  });

  // Sort days in descending order
  const sortedDays = Object.keys(transactionsByDay).sort().reverse();

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, direction === "prev" ? month - 1 : month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="pb-4">
      {/* Month Summary and Tabs - sticky at top */}
      <div className="sticky top-0 z-20 bg-background border-b">
        {/* Month Summary */}
        <div className="grid grid-cols-3 gap-4 px-4 pt-4 pb-3 text-sm">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-semibold text-green-600">{totalIncome.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Exp.</p>
            <p className="font-semibold text-red-600">{totalExpenses.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className={`font-semibold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {monthTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Summary</TabsTrigger>
            <TabsTrigger value="income" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Income</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Expenses</TabsTrigger>
            <TabsTrigger value="debts" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Debts</TabsTrigger>
            <TabsTrigger value="elliw" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">ELLIW</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cashflow Health Summary - shown when Summary tab is active */}
      {activeTab === "summary" && (
        <div className="p-4">
          {/* Health Indicator - Full Width */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                monthTotal >= totalIncome * 0.2 ? "bg-green-100 dark:bg-green-900/20" :
                monthTotal >= 0 ? "bg-yellow-100 dark:bg-yellow-900/20" :
                "bg-red-100 dark:bg-red-900/20"
              }`}>
                {monthTotal >= totalIncome * 0.2 ? "💚" : monthTotal >= 0 ? "⚠️" : "🔴"}
              </div>
              <div className="flex-1">
                <p className={`text-lg font-bold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthTotal >= totalIncome * 0.2 ? "Excellent! Strong savings" :
                   monthTotal >= 0 ? "Good, but could save more" :
                   "Warning: Spending exceeds income"}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-base font-semibold text-green-600">
                  {formatCurrency(totalIncome, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-base font-semibold text-red-600">
                  {formatCurrency(totalExpenses, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Net Cashflow</p>
                <p className={`text-base font-semibold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="text-base font-semibold">
                  {totalIncome > 0 ? ((monthTotal / totalIncome) * 100).toFixed(1) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedDays.length === 0 || 
        (activeTab === "income" && income.length === 0) ||
        (activeTab === "expenses" && expenses.length === 0) ||
        (activeTab === "debts" && debts.length === 0) ||
        (activeTab === "elliw" && wishlist.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">
            {activeTab === "summary" ? "📊" :
             activeTab === "income" ? "💰" :
             activeTab === "expenses" ? "💳" :
             activeTab === "debts" ? "🤝" :
             "✨"}
          </div>
          <p className="text-lg font-medium mb-2">
            {activeTab === "summary" ? "No transactions yet" :
             activeTab === "income" ? "No income recorded" :
             activeTab === "expenses" ? "No expenses recorded" :
             activeTab === "debts" ? "No debts to track" :
             "No wishlist items yet"}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {activeTab === "summary" ? "Start tracking your money by tapping the + button below" :
             activeTab === "income" ? "Add your first income source to start tracking earnings" :
             activeTab === "expenses" ? "Track your spending by adding expenses" :
             activeTab === "debts" ? "Keep track of money you owe or are owed" :
             "Add items you're saving up for"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-4 pt-4">
          {sortedDays.map((dayKey) => {
            const dayData = transactionsByDay[dayKey];
            const date = new Date(dayKey);
            const dayNumber = date.getDate();
            const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
            
            const dayIncome = dayData.income.reduce((sum, i) => sum + (i.amount || 0), 0);
            const dayExpenses = dayData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            // Filter based on active tab
            const hasVisibleItems = 
              activeTab === "summary" ||
              (activeTab === "income" && dayData.income.length > 0) ||
              (activeTab === "expenses" && dayData.expenses.length > 0) ||
              (activeTab === "debts" && dayData.debts.length > 0) ||
              (activeTab === "elliw" && dayData.wishlist.length > 0);

            if (!hasVisibleItems) return null;

            return (
              <div key={dayKey}>
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{dayNumber}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {weekday}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {dayIncome > 0 && (activeTab === "summary" || activeTab === "income") && (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(dayIncome, userCurrency)}
                      </span>
                    )}
                    {dayExpenses > 0 && (activeTab === "summary" || activeTab === "expenses") && (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(dayExpenses, userCurrency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Transactions */}
                <div className="space-y-2 ml-2">
                  {(activeTab === "summary" || activeTab === "income") && dayData.income.map((item) => (
                    <div key={item.id} className="p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-xs">
                            💰
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.source}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.isRecurring ? `Recurring (${item.frequency})` : "Other"}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.amount || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "expenses") && dayData.expenses.map((item) => (
                    <div key={item.id} className="p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-xs">
                            {item.category?.toLowerCase().includes("food") ? "🍔" : "💳"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.recipient}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(item.amount || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "debts") && dayData.debts.map((item) => (
                    <div key={item.id} className="p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs">
                            🤝
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.personName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.direction === "I_OWE" ? "Debt" : "Loan"}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${
                          item.direction === "I_OWE" ? "text-red-600" : "text-green-600"
                        }`}>
                          {formatCurrency(item.currentBalance || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "elliw") && dayData.wishlist.map((item) => (
                    <div key={item.id} className="p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-xs">
                            ✨
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.status === "got" ? "Got it!" : "Want"}
                            </p>
                          </div>
                        </div>
                        {item.amount && (
                          <span className="font-semibold">
                            {formatCurrency(item.amount || 0, userCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
