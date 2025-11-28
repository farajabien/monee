"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface IncomeExpensesCardProps {
  totalIncome: number;
  totalExpenses: number;
  isLoading?: boolean;
}

export function IncomeExpensesCard({
  totalIncome,
  totalExpenses,
  isLoading = false,
}: IncomeExpensesCardProps) {
  const netBalance = totalIncome - totalExpenses;
  const isPositive = netBalance >= 0;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Income vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Income vs Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Income and Expenses Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Income</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatAmount(totalIncome)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              <span>Expenses</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {formatAmount(totalExpenses)}
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Balance</span>
            <div
              className={`text-2xl font-bold flex items-center gap-2 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <span>{formatAmount(netBalance)}</span>
              <span className="text-lg">{isPositive ? "✅" : "⚠️"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
