"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
} from "lucide-react";
import type { YearStats } from "@/types/year-analysis";

interface YearComparisonProps {
  year1Stats: YearStats;
  year2Stats: YearStats;
  formatAmount: (amount: number) => string;
}

export function YearComparison({
  year1Stats,
  year2Stats,
  formatAmount,
}: YearComparisonProps) {
  const calculatePercentChange = (oldValue: number, newValue: number) => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const totalSpentChange = calculatePercentChange(
    year1Stats.totalSpent,
    year2Stats.totalSpent
  );
  const avgExpenseChange = calculatePercentChange(
    year1Stats.avgExpense,
    year2Stats.avgExpense
  );
  const expenseCountChange = calculatePercentChange(
    year1Stats.totalExpenses,
    year2Stats.totalExpenses
  );

  const topRecipientChanged =
    year1Stats.topRecipient.name !== year2Stats.topRecipient.name;

  const ChangeIndicator = ({
    value,
    showAmount = false,
    amount,
  }: {
    value: number;
    showAmount?: boolean;
    amount?: number;
  }) => {
    const isIncrease = value >= 0;
    const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;
    const colorClass = isIncrease ? "text-red-500" : "text-green-500";

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold">
          {Math.abs(value).toFixed(1)}%
        </span>
        {showAmount && amount !== undefined && (
          <span className="text-sm">
            ({isIncrease ? "+" : ""}
            {formatAmount(amount)})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
        <CardHeader>
          <CardTitle>
            Year-over-Year Comparison: {year1Stats.year} vs {year2Stats.year}
          </CardTitle>
          <CardDescription>
            Analyze how your spending patterns have changed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Spent */}
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold">
                  {formatAmount(year2Stats.totalSpent)}
                </span>
              </div>
              <ChangeIndicator
                value={totalSpentChange}
                showAmount
                amount={year2Stats.totalSpent - year1Stats.totalSpent}
              />
              <p className="text-xs text-muted-foreground mt-2">
                vs {formatAmount(year1Stats.totalSpent)} in {year1Stats.year}
              </p>
            </div>

            {/* Avg Expense */}
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Average Expense
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold">
                  {formatAmount(year2Stats.avgExpense)}
                </span>
              </div>
              <ChangeIndicator
                value={avgExpenseChange}
                showAmount
                amount={year2Stats.avgExpense - year1Stats.avgExpense}
              />
              <p className="text-xs text-muted-foreground mt-2">
                vs {formatAmount(year1Stats.avgExpense)} in {year1Stats.year}
              </p>
            </div>

            {/* Expense Count */}
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Total Expenses
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold">
                  {year2Stats.totalExpenses}
                </span>
              </div>
              <ChangeIndicator value={expenseCountChange} />
              <p className="text-xs text-muted-foreground mt-2">
                vs {year1Stats.totalExpenses} in {year1Stats.year}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Recipients Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              {year1Stats.year} Top Recipient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-xl font-bold mb-2">
                {year1Stats.topRecipient.name}
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatAmount(year1Stats.topRecipient.amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {year1Stats.topRecipient.count} expenses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              {year2Stats.year} Top Recipient
              {topRecipientChanged && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Changed
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-xl font-bold mb-2">
                {year2Stats.topRecipient.name}
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatAmount(year2Stats.topRecipient.amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {year2Stats.topRecipient.count} expenses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Expensive Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {year1Stats.year} Peak Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-xl font-bold mb-2">
                {year1Stats.mostExpensiveMonth.month}
              </p>
              <p className="text-3xl font-bold text-red-500">
                {formatAmount(year1Stats.mostExpensiveMonth.amount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {year2Stats.year} Peak Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-xl font-bold mb-2">
                {year2Stats.mostExpensiveMonth.month}
              </p>
              <p className="text-3xl font-bold text-red-500">
                {formatAmount(year2Stats.mostExpensiveMonth.amount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories Comparison</CardTitle>
          <CardDescription>
            Your biggest spending categories in both years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Year 1 Categories */}
            <div>
              <h4 className="font-semibold mb-3">{year1Stats.year}</h4>
              <div className="space-y-2">
                {year1Stats.categories.slice(0, 5).map((cat, idx) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {cat.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Year 2 Categories */}
            <div>
              <h4 className="font-semibold mb-3">{year2Stats.year}</h4>
              <div className="space-y-2">
                {year2Stats.categories.slice(0, 5).map((cat, idx) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {cat.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            {totalSpentChange >= 0 ? (
              <TrendingUp className="h-5 w-5 text-red-500 mt-0.5" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                Your spending {totalSpentChange >= 0 ? "increased" : "decreased"} by{" "}
                {Math.abs(totalSpentChange).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                You spent {formatAmount(Math.abs(year2Stats.totalSpent - year1Stats.totalSpent))}{" "}
                {totalSpentChange >= 0 ? "more" : "less"} in {year2Stats.year} compared to{" "}
                {year1Stats.year}
              </p>
            </div>
          </div>

          {topRecipientChanged && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Your top recipient changed</p>
                <p className="text-sm text-muted-foreground">
                  From {year1Stats.topRecipient.name} to {year2Stats.topRecipient.name}
                </p>
              </div>
            </div>
          )}

          {avgExpenseChange >= 0 && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">
                  Average expense increased by {Math.abs(avgExpenseChange).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Your typical expense is now {formatAmount(year2Stats.avgExpense)} vs{" "}
                  {formatAmount(year1Stats.avgExpense)} before
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
