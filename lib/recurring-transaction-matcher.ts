/**
 * Recurring Transaction Matcher
 *
 * Matches expenses to recurring transactions based on:
 * 1. M-Pesa paybill/till number + account number
 * 2. Recipient name + amount fuzzy matching
 */

import type { Expense } from "@/types";
import type { ParsedExpenseData } from "@/types";

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  recipient: string;
  category: string;
  frequency: string;
  paybillNumber?: string;
  tillNumber?: string;
  accountNumber?: string;
  isActive: boolean;
}

export interface RecurringMatch {
  recurringTransaction: RecurringTransaction;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Normalize paybill/till numbers for comparison
 */
function normalizePaymentNumber(number: string | undefined): string {
  if (!number) return "";
  return number.trim().replace(/\s+/g, "").toLowerCase();
}

/**
 * Normalize recipient names for comparison
 */
function normalizeRecipient(recipient: string | undefined): string {
  if (!recipient) return "";
  return recipient
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b0?\d{9,10}\b/g, ""); // Remove phone numbers
}

/**
 * Check if amounts are approximately equal
 */
function amountsMatch(amount1: number, amount2: number, tolerancePercent: number = 5): boolean {
  const tolerance = (amount2 * tolerancePercent) / 100;
  return Math.abs(amount1 - amount2) <= tolerance;
}

/**
 * Extract paybill/till info from expense description or raw message
 */
function extractPaymentInfo(expense: Expense): {
  paybill?: string;
  till?: string;
  account?: string;
} {
  const rawMessage = expense.rawMessage?.toLowerCase() || "";
  const result: { paybill?: string; till?: string; account?: string } = {};

  // Extract paybill number
  const paybillMatch = rawMessage.match(/paybill[:\s]+(\d+)/i);
  if (paybillMatch) {
    result.paybill = paybillMatch[1];
  }

  // Extract till number
  const tillMatch = rawMessage.match(/till[:\s]+(\d+)/i);
  if (tillMatch) {
    result.till = tillMatch[1];
  }

  // Extract account number
  const accountMatch = rawMessage.match(/account[:\s]+([a-z0-9]+)/i);
  if (accountMatch) {
    result.account = accountMatch[1];
  }

  return result;
}

/**
 * Match an expense to recurring transactions
 */
export function matchExpenseToRecurring(
  expense: Expense,
  recurringTransactions: RecurringTransaction[]
): RecurringMatch | null {
  if (!recurringTransactions || recurringTransactions.length === 0) {
    return null;
  }

  // Only match active recurring transactions
  const activeRecurring = recurringTransactions.filter((rt) => rt.isActive);

  let bestMatch: RecurringMatch | null = null;
  let highestScore = 0;

  const expensePaymentInfo = extractPaymentInfo(expense);

  for (const recurring of activeRecurring) {
    const matchReasons: string[] = [];
    let score = 0;

    // STRICT MATCH: Paybill + Account Number (90 points)
    if (
      recurring.paybillNumber &&
      expensePaymentInfo.paybill &&
      normalizePaymentNumber(recurring.paybillNumber) ===
        normalizePaymentNumber(expensePaymentInfo.paybill)
    ) {
      score += 50;
      matchReasons.push("Paybill number matches");

      if (
        recurring.accountNumber &&
        expensePaymentInfo.account &&
        normalizePaymentNumber(recurring.accountNumber) ===
          normalizePaymentNumber(expensePaymentInfo.account)
      ) {
        score += 40;
        matchReasons.push("Account number matches");
      }
    }

    // STRICT MATCH: Till Number (70 points)
    if (
      recurring.tillNumber &&
      expensePaymentInfo.till &&
      normalizePaymentNumber(recurring.tillNumber) ===
        normalizePaymentNumber(expensePaymentInfo.till)
    ) {
      score += 70;
      matchReasons.push("Till number matches");
    }

    // FUZZY MATCH: Recipient Name (30 points)
    const normalizedRecurringRecipient = normalizeRecipient(recurring.recipient);
    const normalizedExpenseRecipient = normalizeRecipient(expense.recipient);

    if (normalizedRecurringRecipient && normalizedExpenseRecipient) {
      if (normalizedRecurringRecipient === normalizedExpenseRecipient) {
        score += 30;
        matchReasons.push("Recipient name exact match");
      } else if (
        normalizedExpenseRecipient.includes(normalizedRecurringRecipient) ||
        normalizedRecurringRecipient.includes(normalizedExpenseRecipient)
      ) {
        score += 20;
        matchReasons.push("Recipient name partial match");
      }
    }

    // FUZZY MATCH: Amount (20 points if within 5% tolerance)
    if (amountsMatch(expense.amount, recurring.amount, 5)) {
      score += 20;
      matchReasons.push("Amount matches (within 5%)");
    } else if (amountsMatch(expense.amount, recurring.amount, 10)) {
      score += 10;
      matchReasons.push("Amount similar (within 10%)");
    }

    // Update best match if this is better
    if (score > highestScore && score >= 50) {
      // Minimum 50 points to be considered a match
      highestScore = score;
      bestMatch = {
        recurringTransaction: recurring,
        matchScore: score,
        matchReasons,
      };
    }
  }

  return bestMatch;
}

/**
 * Match a parsed transaction (from M-Pesa message) to recurring transactions
 */
export function matchParsedToRecurring(
  parsed: ParsedExpenseData,
  rawMessage: string,
  recurringTransactions: RecurringTransaction[]
): RecurringMatch | null {
  if (!recurringTransactions || recurringTransactions.length === 0) {
    return null;
  }

  // Create a temporary expense-like object for matching
  const tempExpense: Expense = {
    id: "temp",
    amount: parsed.amount,
    recipient: parsed.recipient || "",
    date: parsed.timestamp || Date.now(),
    category: "Uncategorized",
    rawMessage: rawMessage,
    parsedData: parsed,
    createdAt: Date.now(),
  };

  return matchExpenseToRecurring(tempExpense, recurringTransactions);
}

/**
 * Get match confidence level based on score
 */
export function getMatchConfidence(
  score: number
): "high" | "medium" | "low" | "none" {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 50) return "low";
  return "none";
}

/**
 * Get recommended action based on match confidence
 */
export function getRecommendedAction(
  match: RecurringMatch | null
): "auto-link" | "suggest" | "ignore" {
  if (!match) return "ignore";

  const confidence = getMatchConfidence(match.matchScore);

  switch (confidence) {
    case "high":
      return "auto-link"; // Automatically link to recurring transaction
    case "medium":
    case "low":
      return "suggest"; // Suggest to user
    default:
      return "ignore";
  }
}

/**
 * Batch match multiple expenses to recurring transactions
 */
export function batchMatchToRecurring(
  expenses: Expense[],
  recurringTransactions: RecurringTransaction[]
): Map<string, RecurringMatch> {
  const matches = new Map<string, RecurringMatch>();

  for (const expense of expenses) {
    const match = matchExpenseToRecurring(expense, recurringTransactions);
    if (match && match.matchScore >= 50) {
      matches.set(expense.id, match);
    }
  }

  return matches;
}
