// Note: {} types are required by InstantDB for relation types
// These lint warnings can be safely ignored
import { InstaQLEntity } from "@instantdb/react";
import schema from "./instant.schema";

// Profile types
export type Profile = InstaQLEntity<typeof schema, "profiles">;
export type ProfileWithUser = InstaQLEntity<
  typeof schema,
  "profiles",
  { user: object }
>;

// Expense types
export type Expense = InstaQLEntity<typeof schema, "expenses">;
export type ExpenseWithUser = InstaQLEntity<
  typeof schema,
  "expenses",
  { profile: object }
>;

// Category types
export type Category = InstaQLEntity<typeof schema, "categories">;
export type CategoryWithUser = InstaQLEntity<
  typeof schema,
  "categories",
  { profile: object }
>;

// Budget types
export type Budget = InstaQLEntity<
  typeof schema,
  "budgets",
  { category: object; profile: object }
>;
export type BudgetWithRelations = InstaQLEntity<
  typeof schema,
  "budgets",
  { category: object; profile: object }
>;

// ELTIW Item types
export type EltiwItem = InstaQLEntity<typeof schema, "eltiw_items">;
export type EltiwItemWithUser = InstaQLEntity<
  typeof schema,
  "eltiw_items",
  { profile: object }
>;

// Daily Check-in types
export type DailyCheckin = InstaQLEntity<typeof schema, "daily_checkins">;
export type DailyCheckinWithUser = InstaQLEntity<
  typeof schema,
  "daily_checkins",
  { profile: object }
>;

// Income Source types
export type IncomeSource = InstaQLEntity<typeof schema, "income_sources">;
export type IncomeSourceWithUser = InstaQLEntity<
  typeof schema,
  "income_sources",
  { profile: object }
>;

// Debt types
export type Debt = InstaQLEntity<typeof schema, "debts">;
export type DebtWithUser = InstaQLEntity<
  typeof schema,
  "debts",
  { profile: object }
>;

// Debt Payment types
export type DebtPayment = InstaQLEntity<typeof schema, "debt_payments">;
export type DebtPaymentWithDebt = InstaQLEntity<
  typeof schema,
  "debt_payments",
  { debt: object }
>;

// Recipient types
export type Recipient = InstaQLEntity<typeof schema, "recipients">;
export type RecipientWithUser = InstaQLEntity<
  typeof schema,
  "recipients",
  { profile: object }
>;

// Savings Goal types
export type SavingsGoal = InstaQLEntity<typeof schema, "savings_goals">;
export type SavingsGoalWithUser = InstaQLEntity<
  typeof schema,
  "savings_goals",
  { profile: object }
>;
export type SavingsGoalWithContributions = InstaQLEntity<
  typeof schema,
  "savings_goals",
  { contributions: object }
>;

// Savings Contribution types
export type SavingsContribution = InstaQLEntity<
  typeof schema,
  "savings_contributions"
>;
export type SavingsContributionWithGoal = InstaQLEntity<
  typeof schema,
  "savings_contributions",
  { goal: object }
>;

// Recurring Transaction types
export type RecurringTransaction = InstaQLEntity<
  typeof schema,
  "recurring_transactions"
>;
export type RecurringTransactionWithUser = InstaQLEntity<
  typeof schema,
  "recurring_transactions",
  { profile: object }
>;

// Statement Expense types
export type StatementExpense = InstaQLEntity<
  typeof schema,
  "statement_expenses"
>;
export type StatementExpenseWithUser = InstaQLEntity<
  typeof schema,
  "statement_expenses",
  { profile: object }
>;

// Feedback types
export type Feedback = InstaQLEntity<typeof schema, "feedback">;
export type FeedbackWithUser = InstaQLEntity<
  typeof schema,
  "feedback",
  { profile: object }
>;

// Payment type enum
export type PaymentType = "interest_only" | "principal" | "both";

// Parsed expense data structure
export interface ParsedExpenseData {
  amount: number;
  recipient?: string;
  expenseType?: "send" | "receive" | "buy" | "withdraw" | "deposit";
  reference?: string;
  balance?: number;
  timestamp?: number;
}
