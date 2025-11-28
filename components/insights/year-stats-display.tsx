"use client";

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
import type { YearStats } from "@/types/year-analysis";

interface YearStatsDisplayProps {
  yearStats: YearStats;
  formatAmount: (amount: number) => string;
  showAchievements?: boolean;
  headerAction?: React.ReactNode; // For year selector or other controls
  footerCTA?: React.ReactNode; // For call-to-action section
}

export function YearStatsDisplay({
  yearStats,
  formatAmount,
  showAchievements = false,
  headerAction,
  footerCTA,
}: YearStatsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Year Selector or Other Header Actions */}
      {headerAction && headerAction}

      {/* Hero Stats */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Your {yearStats.year} Financial Year in Review 🇰🇪
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
              <p className="text-2xl font-bold">{yearStats.totalExpenses}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Avg Expense</p>
              <p className="text-2xl font-bold text-green-500">
                {formatAmount(yearStats.avgExpense)}
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
            {showAchievements ? "Top Spending Categories" : "Where Your Money Went"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearStats.categories.slice(0, 6).map((cat) => (
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

      {/* Achievements (only shown for app analyzer) */}
      {showAchievements && yearStats.achievements && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {yearStats.year} Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold mb-1">
                  {yearStats.achievements.totalCategories}
                </p>
                <p className="text-xs text-muted-foreground">
                  Categories Tracked
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold mb-1">
                  {yearStats.achievements.totalBudgets}
                </p>
                <p className="text-xs text-muted-foreground">Budgets Created</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold mb-1">
                  {yearStats.achievements.debtsCleared}
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
      )}

      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Your {yearStats.year} Money Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">First Expense</p>
              <p className="font-medium">
                {yearStats.firstExpense.toLocaleDateString("en-KE", {
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
                {yearStats.lastExpense.toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer CTA (for free analyzer) */}
      {footerCTA && footerCTA}
    </div>
  );
}
