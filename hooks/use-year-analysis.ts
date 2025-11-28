import { useMemo } from "react";
import type {
  YearStats,
  AnalysisExpense,
  YearAnalysisOptions,
} from "@/types/year-analysis";
import type { Expense, ParsedExpenseData } from "@/types";

/**
 * Shared hook for calculating year statistics
 * Works with both database expenses (Expense[]) and parsed expenses (ParsedExpenseData[])
 */
export function useYearAnalysis(
  expenses: AnalysisExpense[],
  year: number,
  options?: YearAnalysisOptions
): YearStats | null {
  return useMemo(() => {
    // Filter expenses for the selected year
    const yearExpenses = expenses.filter((expense) => {
      let expenseDate: Date;

      // Handle both Expense and ParsedExpenseData types
      if ("date" in expense) {
        // Database expense
        expenseDate = new Date(expense.date || expense.createdAt);
      } else if ("timestamp" in expense) {
        // Parsed expense
        if (!expense.timestamp) return false;
        expenseDate = new Date(expense.timestamp);
      } else {
        return false;
      }

      return expenseDate.getFullYear() === year;
    });

    if (yearExpenses.length === 0) return null;

    // Calculate total spent
    const totalSpent = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Find top recipient
    const recipientMap = new Map<string, { amount: number; count: number }>();
    yearExpenses.forEach((expense) => {
      const recipientName = expense.recipient || "Unknown";
      const current = recipientMap.get(recipientName) || { amount: 0, count: 0 };
      recipientMap.set(recipientName, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
      });
    });

    let topRecipient = { name: "Unknown", amount: 0, count: 0 };
    recipientMap.forEach((data, name) => {
      if (data.amount > topRecipient.amount) {
        // Use nickname if available (for app analyzer)
        const displayName =
          options?.recipientNicknames?.get(name) || name;
        topRecipient = { name: displayName, ...data };
      }
    });

    // Monthly spending
    const monthlyMap = new Map<string, number>();
    yearExpenses.forEach((expense) => {
      let expenseDate: Date;
      if ("date" in expense) {
        expenseDate = new Date(expense.date || expense.createdAt);
      } else if ("timestamp" in expense && expense.timestamp) {
        expenseDate = new Date(expense.timestamp);
      } else {
        return;
      }

      const monthKey = expenseDate.toLocaleDateString("en-US", {
        month: "long",
      });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + expense.amount);
    });

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

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));

    const mostExpensiveMonth =
      monthlySpending.length > 0
        ? monthlySpending.reduce((max, curr) =>
            curr.amount > max.amount ? curr : max
          )
        : { month: "", amount: 0 };

    // Category/Expense Type breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    yearExpenses.forEach((expense) => {
      let categoryName: string;

      if (options?.groupBy === "expenseType" && "expenseType" in expense) {
        // Use expenseType from ParsedExpenseData
        categoryName = (expense as ParsedExpenseData).expenseType || "Other";
      } else if ("category" in expense) {
        // Use category from Expense
        categoryName = (expense as Expense).category || "Uncategorized";
      } else {
        categoryName = "Uncategorized";
      }

      const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };
      categoryMap.set(categoryName, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
      });
    });

    const categories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate avg expense
    const avgExpense = totalSpent / yearExpenses.length;

    // Find first and last expense
    const timestamps = yearExpenses
      .map((expense) => {
        if ("date" in expense) {
          return expense.date || expense.createdAt;
        } else if ("timestamp" in expense) {
          return expense.timestamp || 0;
        }
        return 0;
      })
      .filter((ts) => ts > 0);

    const firstExpense = new Date(Math.min(...timestamps));
    const lastExpense = new Date(Math.max(...timestamps));

    // Calculate achievements (only if data provided)
    let achievements;
    if (options?.includeAchievements) {
      const { categories: allCategories, budgets, debts } = options.includeAchievements;

      // Filter budgets for this year
      const yearBudgets = budgets.filter((b: any) => {
        const budgetDate = new Date(b.year, b.month - 1);
        return budgetDate.getFullYear() === year;
      });

      achievements = {
        totalCategories: allCategories.length,
        totalBudgets: yearBudgets.length,
        debtsCleared: debts.filter((d: any) => d.currentBalance === 0).length,
      };
    }

    return {
      year,
      totalSpent,
      totalExpenses: yearExpenses.length,
      avgExpense,
      topRecipient,
      monthlySpending,
      mostExpensiveMonth,
      categories,
      firstExpense,
      lastExpense,
      totalRecipients: recipientMap.size,
      achievements,
    };
  }, [expenses, year, options]);
}

/**
 * Helper to get all available years from expenses
 */
export function useAvailableYears(expenses: AnalysisExpense[]): number[] {
  return useMemo(() => {
    const yearsSet = new Set<number>();

    expenses.forEach((expense) => {
      let expenseDate: Date | null = null;

      if ("date" in expense) {
        expenseDate = new Date(expense.date || expense.createdAt);
      } else if ("timestamp" in expense && expense.timestamp) {
        expenseDate = new Date(expense.timestamp);
      }

      if (expenseDate) {
        yearsSet.add(expenseDate.getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a); // Most recent first
  }, [expenses]);
}
