// Note: {} types are required by InstantDB for relation types
// These lint warnings can be safely ignored
import { InstaQLEntity } from "@instantdb/react";
import schema from "./instant.schema";

// Profile types
export type Profile = InstaQLEntity<typeof schema, "profiles">;
export type ProfileWithUser = InstaQLEntity<
  typeof schema,
  "profiles",
  { user: {} }
>;

// Transaction types
export type Transaction = InstaQLEntity<typeof schema, "transactions">;
export type TransactionWithUser = InstaQLEntity<
  typeof schema,
  "transactions",
  { user: {} }
>;

// Category types
export type Category = InstaQLEntity<typeof schema, "categories">;
export type CategoryWithUser = InstaQLEntity<
  typeof schema,
  "categories",
  { user: {} }
>;

// Budget types
export type Budget = InstaQLEntity<
  typeof schema,
  "budgets",
  { category: {}; user: {} }
>;
export type BudgetWithRelations = InstaQLEntity<
  typeof schema,
  "budgets",
  { category: {}; user: {} }
>;

// ELTIW Item types
export type EltiwItem = InstaQLEntity<typeof schema, "eltiw_items">;
export type EltiwItemWithUser = InstaQLEntity<
  typeof schema,
  "eltiw_items",
  { user: {} }
>;

// Daily Check-in types
export type DailyCheckin = InstaQLEntity<typeof schema, "daily_checkins">;
export type DailyCheckinWithUser = InstaQLEntity<
  typeof schema,
  "daily_checkins",
  { user: {} }
>;

// Parsed transaction data structure
export interface ParsedTransactionData {
  amount: number;
  recipient?: string;
  transactionType?: "send" | "receive" | "buy" | "withdraw" | "deposit";
  reference?: string;
  balance?: number;
  timestamp?: number;
}
