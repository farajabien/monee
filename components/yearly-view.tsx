"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { motion, AnimatePresence } from "framer-motion";

interface YearlyViewProps {
  profileId?: string;
}

export function YearlyView({ profileId }: YearlyViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  // Fetch all income/expenses to aggregate locally
  // In a larger app, we might want to filter by date range at the query level,
  // but for "Yearly" view, usually grabbing the specific year's range is best.
  // Optimization: Calculate start/end of selected year
  const startOfYear = new Date(selectedYear, 0, 1).getTime();
  const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999).getTime();

  const { data } = db.useQuery({
    income: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
    },
    expenses: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
    },
  });

  const income = data?.income || [];
  const expenses = data?.expenses || [];

  // --- Aggregation Logic ---

  // 1. Yearly Totals
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  // 2. Group by Month
  const monthlyData: Record<string, { income: number; expenses: number; items: any[] }> = {};
  
  // Initialize all 12 months for the year so we show empty ones too (optional, but good for "Yearly Overview")
  // Or just show months with data. Let's show all months reverse chronological for consistency?
  // Let's stick to months that have data + maybe filler if needed, but standard is usually just months with activity or all 12.
  // Let's do all 12 months to show the full year picture.
  for (let m = 0; m < 12; m++) {
    const key = `${selectedYear}-${(m + 1).toString().padStart(2, "0")}`;
    monthlyData[key] = { income: 0, expenses: 0, items: [] };
  }

  [...income, ...expenses].forEach((item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    
    if (monthlyData[key]) {
        if ("source" in item) {
            monthlyData[key].income += item.amount || 0;
        } else {
            monthlyData[key].expenses += item.amount || 0;
        }
        monthlyData[key].items.push(item);
    }
  });

  // Filter out future months if current year? Or just show all?
  // Let's show all 12 months in reverse order (Dec -> Jan)
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

  const navigateYear = (direction: "prev" | "next") => {
    setSelectedYear((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  return (
    <div className="pb-4 space-y-6">
      
      {/* 1. Year Selector Header */}
      <div className="flex items-center justify-between px-2 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigateYear("prev")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">{selectedYear} Overview</h2>
        <Button variant="ghost" size="icon" onClick={() => navigateYear("next")}>
            <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 2. Summary Card (Teal Theme) */}
      <Card className="mx-2 bg-gradient-to-br from-teal-500 to-teal-600 border-none text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl -ml-12 -mb-12 pointer-events-none" />
        
        <div className="p-6 relative z-10">
            <h3 className="text-teal-100 text-sm font-medium mb-1">Net Cashflow</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                    {netCashflow >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netCashflow), userCurrency)}
                </span>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
                <div>
                    <p className="text-teal-100 text-xs">Income</p>
                    <p className="font-semibold">{formatCurrency(totalIncome, userCurrency)}</p>
                </div>
                <div>
                    <p className="text-teal-100 text-xs">Expense</p>
                    <p className="font-semibold">{formatCurrency(totalExpenses, userCurrency)}</p>
                </div>
                <div>
                    <p className="text-teal-100 text-xs">Saved</p>
                    <p className="font-semibold">{savingsRate.toFixed(1)}%</p>
                </div>
            </div>
        </div>
      </Card>

      {/* 3. Months List */}
      <div className="space-y-3 px-2">
        <h3 className="text-sm font-semibold text-muted-foreground ml-1">Monthly Breakdown</h3>
        
        {sortedMonths.map((monthKey) => {
            const data = monthlyData[monthKey];
            const [year, month] = monthKey.split("-");
            const dateObj = new Date(parseInt(year), parseInt(month) - 1);
            const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });
            const net = data.income - data.expenses;
            const isExpanded = expandedMonths.has(monthKey);
            
            // Skip future months if they have no data? 
            // Often generally good to hide months with 0 activity if they are in the future?
            // For now, let's just show them if they have 0 activity, it's fine.
            // Maybe dim them?
            const hasActivity = data.income > 0 || data.expenses > 0;
            const isFuture = dateObj > new Date();

            if (!hasActivity && isFuture) return null; // Hide future empty months

            return (
                <div key={monthKey}>
                    <Card
                        className={`overflow-hidden transition-all duration-200 border-none shadow-sm hover:shadow-md ${
                            isExpanded ? "ring-1 ring-teal-500/20" : ""
                        }`}
                    >
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer active:bg-accent/50"
                            onClick={() => toggleMonth(monthKey)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                    net >= 0 ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                                }`}>
                                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{monthName}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="text-green-600">+{formatCurrency(data.income, userCurrency)}</span>
                                        <span>•</span>
                                        <span className="text-red-600">-{formatCurrency(data.expenses, userCurrency)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className={`font-bold text-sm ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {net > 0 ? "+" : ""}{formatCurrency(net, userCurrency)}
                                </p>
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                                )}
                            </div>
                        </div>

                        {/* Expanded Content with Animation */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-4 pb-4 border-t bg-accent/5"
                                >
                                    <div className="pt-3 space-y-2">
                                        {data.items.length > 0 ? (
                                            data.items.sort((a,b) => b.date - a.date).map((item, idx) => {
                                                const isIncome = "source" in item;
                                                return (
                                                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-green-500" : "bg-red-500"}`} />
                                                            <span className="text-muted-foreground truncate max-w-[150px]">
                                                                {isIncome ? item.source : (item.recipient || item.category)}
                                                            </span>
                                                        </div>
                                                        <span className={isIncome ? "text-green-600" : "text-red-600"}>
                                                            {isIncome ? "+" : "-"}{formatCurrency(item.amount || 0, userCurrency)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-2">No transactions this month</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>
            );
        })}
      </div>
    </div>
  );
}
