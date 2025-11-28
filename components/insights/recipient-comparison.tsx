"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import type { AnalysisExpense } from "@/types/year-analysis";

interface RecipientComparisonProps {
  expenses: AnalysisExpense[];
  years: number[]; // Array of years to compare (e.g., [2024, 2025])
  formatAmount: (amount: number) => string;
  topN?: number; // Show top N recipients (default 10)
}

interface RecipientYearData {
  recipient: string;
  yearAmounts: Record<number, number>; // year -> amount
  yearCounts: Record<number, number>; // year -> count
  totalAmount: number;
}

export function RecipientComparison({
  expenses,
  years,
  formatAmount,
  topN = 10,
}: RecipientComparisonProps) {
  const recipientData = useMemo(() => {
    const recipientMap = new Map<string, RecipientYearData>();

    expenses.forEach((expense) => {
      const recipientName = expense.recipient || "Unknown";

      // Determine year from expense
      let expenseYear: number | null = null;
      if ("date" in expense) {
        expenseYear = new Date(expense.date || expense.createdAt).getFullYear();
      } else if ("timestamp" in expense && expense.timestamp) {
        expenseYear = new Date(expense.timestamp).getFullYear();
      }

      if (!expenseYear || !years.includes(expenseYear)) return;

      if (!recipientMap.has(recipientName)) {
        recipientMap.set(recipientName, {
          recipient: recipientName,
          yearAmounts: {},
          yearCounts: {},
          totalAmount: 0,
        });
      }

      const data = recipientMap.get(recipientName)!;
      data.yearAmounts[expenseYear] =
        (data.yearAmounts[expenseYear] || 0) + expense.amount;
      data.yearCounts[expenseYear] =
        (data.yearCounts[expenseYear] || 0) + 1;
      data.totalAmount += expense.amount;
    });

    // Convert to array and sort by total amount
    return Array.from(recipientMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, topN);
  }, [expenses, years, topN]);

  const maxAmount = useMemo(() => {
    return Math.max(
      ...recipientData.flatMap((r) => Object.values(r.yearAmounts))
    );
  }, [recipientData]);

  const calculateChange = (recipient: RecipientYearData) => {
    if (years.length !== 2) return null;
    const [year1, year2] = years;
    const amount1 = recipient.yearAmounts[year1] || 0;
    const amount2 = recipient.yearAmounts[year2] || 0;

    if (amount1 === 0) return null;

    const percentChange = ((amount2 - amount1) / amount1) * 100;
    return {
      percent: percentChange,
      amount: amount2 - amount1,
    };
  };

  if (recipientData.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            No recipient data found for the selected years: {years.join(", ")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipient Spending Comparison
          </CardTitle>
          <CardDescription>
            Top {recipientData.length} recipients across {years.join(", ")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recipientData.map((recipient) => {
            const change = calculateChange(recipient);

            return (
              <div key={recipient.recipient} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{recipient.recipient}</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatAmount(recipient.totalAmount)}
                    </p>
                  </div>
                  {change && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        change.percent >= 0
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {change.percent >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{Math.abs(change.percent).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {/* Year-by-year bars */}
                <div className="space-y-2">
                  {years.map((year) => {
                    const amount = recipient.yearAmounts[year] || 0;
                    const count = recipient.yearCounts[year] || 0;
                    const widthPercent = (amount / maxAmount) * 100;

                    return (
                      <div key={year} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-12">
                          {year}
                        </span>
                        <div className="flex-1 relative">
                          <div className="w-full bg-muted rounded-full h-6">
                            <div
                              className="bg-primary rounded-full h-6 transition-all flex items-center justify-between px-2"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {amount > 0 && (
                                <span className="text-xs font-medium text-primary-foreground">
                                  {formatAmount(amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {count} {count === 1 ? "expense" : "expenses"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {years.map((year) => {
              const yearTotal = recipientData.reduce(
                (sum, r) => sum + (r.yearAmounts[year] || 0),
                0
              );
              const yearCount = recipientData.reduce(
                (sum, r) => sum + (r.yearCounts[year] || 0),
                0
              );

              return (
                <div key={year} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{year}</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(yearTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {yearCount} total expenses
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
