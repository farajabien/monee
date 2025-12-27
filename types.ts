// Note: {} types are required by InstantDB for relation types to work correctly
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

// Income types
export type IncomeSource = InstaQLEntity<typeof schema, "income">;

// Debt types
export type Debt = InstaQLEntity<typeof schema, "debts">;

// Wishlist types
export type WishlistItem = InstaQLEntity<typeof schema, "wishlist">;

// Category types
// TODO: Add categories entity to schema before enabling these types
// export type Category = InstaQLEntity<typeof schema, "categories">;
// export type CategoryWithUser = InstaQLEntity<
//   typeof schema,
//   "categories",
//   { profile: object }
// >;

// Temporary inline type for categories until schema is updated
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}




// Payment type enum
export type PaymentType = "interest_only" | "principal" | "both";

// Recurring frequency types
export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annually";

// Debt type enum
export type DebtType = "one-time" | "interest-push" | "amortizing";

// Compounding frequency enum
export type CompoundingFrequency = "monthly" | "quarterly" | "annually";


// Parsed expense data structure
export interface ParsedExpenseData {
  amount: number;
  recipient?: string;
  expenseType?: "send" | "receive" | "buy" | "withdraw" | "deposit";
  reference?: string;
  balance?: number;
  timestamp?: number;
  phoneNumber?: string; // Extracted phone number from SMS (e.g., 0712345678)
  transactionCost?: number; // Transaction fee charged by M-Pesa
}

export interface Recipient {
  id: string;
  originalName: string;
  nickname: string;
}

export interface RecurringTransaction {
  id: string;
  recipient: string;
  category: string;
  amount: number;
  frequency: string;
  lastPaidDate?: number;
  dueDate?: number;
  reminderDays?: number;
  isActive: boolean;
  isPaused: boolean;
  createdAt: number;
  updatedAt?: number;
}
