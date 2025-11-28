import type { Expense, Category, Budget, Debt } from "@/types";

/**
 * Parsed expense data structure from SMS/PDF
 */
export interface ParsedExpenseData {
  amount: number;
  recipient?: string;
  expenseType?: "send" | "receive" | "buy" | "withdraw" | "deposit";
  reference?: string;
  balance?: number;
  timestamp?: number;
}

/**
 * Unified expense data type that works with both database expenses and parsed expenses
 */
export type AnalysisExpense = Expense | ParsedExpenseData;

/**
 * Stats for a single year's financial analysis
 */
export interface YearStats {
  year: number;
  totalSpent: number;
  totalExpenses: number;
  avgExpense: number;
  topRecipient: {
    name: string;
    amount: number;
    count: number;
  };
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  mostExpensiveMonth: {
    month: string;
    amount: number;
  };
  categories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  firstExpense: Date;
  lastExpense: Date;
  totalRecipients: number;
  // Optional achievements (only for app analyzer)
  achievements?: {
    totalCategories: number;
    totalBudgets: number;
    debtsCleared: number;
  };
}

/**
 * Comparison between two years
 */
export interface YearComparisonStats {
  year1: YearStats;
  year2: YearStats;
  changes: {
    totalSpentChange: number; // percentage
    totalSpentChangeAmount: number; // absolute
    expenseCountChange: number; // percentage
    avgExpenseChange: number; // percentage
    topRecipientChanged: boolean;
  };
}

/**
 * Recipient analysis for comparison view
 */
export interface RecipientAnalysis {
  recipient: string;
  totalAmount: number;
  transactionCount: number;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
  }>;
  avgTransaction: number;
}

/**
 * Saved analysis data for browser storage
 */
export interface SavedAnalysis {
  id: string;
  timestamp: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  yearStats: YearStats;
  inputMethod: "pdf" | "statement" | "sms";
  fileName?: string;
}

/**
 * Options for year analysis
 */
export interface YearAnalysisOptions {
  // Use recipient nicknames if available (for app analyzer)
  recipientNicknames?: Map<string, string>;
  // Include achievements data (for app analyzer)
  includeAchievements?: {
    categories: Category[];
    budgets: Budget[];
    debts: Debt[];
  };
  // Group by expense type or category
  groupBy?: "category" | "expenseType";
}
