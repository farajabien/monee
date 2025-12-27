"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";

interface MonthlyViewProps {
  profileId?: string;
}

export function MonthlyView({ profileId }: MonthlyViewProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

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

  const { data } = db.useQuery({
    income: {
      $: {
        where: {
          profile: profileId,
        },
      },
    },
    expenses: {
      $: {
        where: {
          profile: profileId,
        },
      },
    },
  });

  const income = data?.income || [];
  const expenses = data?.expenses || [];

  // Group transactions by year and month
  const monthlyData: Record<string, { income: number; expenses: number; items: any[] }> = {};

  [...income, ...expenses].forEach((item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = { income: 0, expenses: 0, items: [] };
    }

    if ("source" in item) {
      // It's income
      monthlyData[key].income += item.amount || 0;
    } else {
      // It's expense
      monthlyData[key].expenses += item.amount || 0;
    }
    monthlyData[key].items.push(item);
  });

  // Sort months in descending order
  const sortedMonths = Object.keys(monthlyData).sort().reverse();

  const toggleMonth = (key: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMonths(newExpanded);
  };

  // Calculate overall totals for all months
  const allIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const allExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netTotal = allIncome - allExpenses;

  if (sortedMonths.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Monthly Summary</h2>
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Monthly Summary</h2>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Summary</TabsTrigger>
          <TabsTrigger value="income" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Income</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Expenses</TabsTrigger>
          <TabsTrigger value="debts" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Debts</TabsTrigger>
          <TabsTrigger value="elliw" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">ELLIW</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cashflow Health Summary - shown when Summary tab is active */}
      {activeTab === "summary" && (
        <div className="mb-4">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Overall Cashflow Health</h3>
            
            {/* Health Indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                netTotal >= allIncome * 0.2 ? "bg-green-100 dark:bg-green-900/20" :
                netTotal >= 0 ? "bg-yellow-100 dark:bg-yellow-900/20" :
                "bg-red-100 dark:bg-red-900/20"
              }`}>
                {netTotal >= allIncome * 0.2 ? "💚" : netTotal >= 0 ? "⚠️" : "🔴"}
              </div>
              <div className="flex-1">
                <p className={`text-lg font-bold ${netTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(netTotal), userCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {netTotal >= allIncome * 0.2 ? "Excellent! Strong savings" :
                   netTotal >= 0 ? "Good, but could save more" :
                   "Warning: Spending exceeds income"}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-base font-semibold text-green-600">
                  {formatCurrency(allIncome, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-base font-semibold text-red-600">
                  {formatCurrency(allExpenses, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Net Cashflow</p>
                <p className={`text-base font-semibold ${netTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(netTotal), userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="text-base font-semibold">
                  {allIncome > 0 ? ((netTotal / allIncome) * 100).toFixed(1) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
        <div>Income</div>
        <div className="text-right">Exp.</div>
        <div className="text-right">Total</div>
      </div>

      {/* Monthly Rows */}
      <div className="space-y-1">
        {sortedMonths.map((monthKey) => {
          const data = monthlyData[monthKey];
          const [year, month] = monthKey.split("-");
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "short" });
          const isExpanded = expandedMonths.has(monthKey);
          const net = data.income - data.expenses;

          // Filter items based on active tab
          const filteredItems = data.items.filter((item) => {
            if (activeTab === "summary") return true;
            if (activeTab === "income" && "source" in item) return true;
            if (activeTab === "expenses" && "recipient" in item) return true;
            if (activeTab === "debts" && "personName" in item) return true;
            if (activeTab === "elliw" && "itemName" in item) return true;
            return false;
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={monthKey}>
              <Card
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleMonth(monthKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{monthName}</p>
                      <p className="text-xs text-muted-foreground">{year} • {data.items.length} transactions</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {data.income.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {data.expenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {net >= 0 ? "+" : ""}{net.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Math.abs(net), userCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Expanded details */}
              {isExpanded && (
                <div className="ml-8 mt-2 space-y-1">
                  {filteredItems
                    .sort((a, b) => b.date - a.date)
                    .map((item, idx) => {
                      const isIncome = "source" in item;
                      return (
                        <Card key={`${item.id}-${idx}`} className="p-3 bg-accent/20">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium">
                                {isIncome ? item.source : item.recipient}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString()}
                                {!isIncome && item.category && ` • ${item.category}`}
                              </p>
                            </div>
                            <p className={`font-semibold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                              {isIncome ? "+" : "-"}{formatCurrency(item.amount || 0, userCurrency)}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
