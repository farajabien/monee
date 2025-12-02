/**
 * Duplicate Detection System
 *
 * Detects potential duplicate transactions using:
 * 1. Strict matching: M-Pesa reference codes
 * 2. Fuzzy matching: Amount, date, and recipient similarity
 */

import type { Expense } from "@/types";
import type { ParsedExpenseData } from "@/types";

export type ConfidenceLevel = "exact" | "likely" | "possible" | "none";

export interface DuplicateMatch {
  expense: Expense;
  confidence: ConfidenceLevel;
  matchReasons: string[];
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
  highestConfidence: ConfidenceLevel;
}

/**
 * Normalize recipient names for comparison
 * Removes phone numbers, extra spaces, and converts to lowercase
 */
function normalizeRecipient(recipient: string | undefined): string {
  if (!recipient) return "";

  return recipient
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")              // Normalize spaces
    .replace(/\b0?\d{9,10}\b/g, "")   // Remove phone numbers
    .trim();
}

/**
 * Check if two recipients match (exact or substring match)
 */
function recipientsMatch(
  recipient1: string | undefined,
  recipient2: string | undefined,
  strictness: "strict" | "relaxed" = "relaxed"
): boolean {
  const norm1 = normalizeRecipient(recipient1);
  const norm2 = normalizeRecipient(recipient2);

  if (!norm1 || !norm2) return false;

  // Exact match after normalization
  if (norm1 === norm2) return true;

  if (strictness === "strict") return false;

  // Substring match (for "John" vs "John Doe")
  if (norm1.length >= 3 && norm2.length >= 3) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  }

  return false;
}

/**
 * Check if two amounts are approximately equal
 * Allows for small floating point differences
 */
function amountsMatch(
  amount1: number,
  amount2: number,
  tolerance: number = 1
): boolean {
  return Math.abs(amount1 - amount2) < tolerance;
}

/**
 * Check if two dates are within a specified number of days
 */
function datesMatch(
  date1: number,
  date2: number,
  daysTolerance: number = 2
): boolean {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.abs(date1 - date2) / msPerDay;
  return daysDiff <= daysTolerance;
}

/**
 * Strict matching: Compare M-Pesa reference codes
 */
function matchByReference(
  parsedRef: string | undefined,
  expenseRef: string | undefined
): boolean {
  if (!parsedRef || !expenseRef) return false;

  return parsedRef.trim().toUpperCase() === expenseRef.trim().toUpperCase();
}

/**
 * Detect potential duplicates for a parsed transaction
 */
export function detectDuplicates(
  parsed: ParsedExpenseData,
  existingExpenses: Expense[]
): DuplicateDetectionResult {
  const matches: DuplicateMatch[] = [];

  for (const expense of existingExpenses) {
    const matchReasons: string[] = [];
    let confidence: ConfidenceLevel = "none";

    // EXACT MATCH: M-Pesa reference code
    if (parsed.reference && expense.mpesaReference) {
      if (matchByReference(parsed.reference, expense.mpesaReference)) {
        matchReasons.push("M-PESA reference code matches");
        confidence = "exact";
        matches.push({ expense, confidence, matchReasons });
        continue; // Exact match found, no need for further checks
      }
    }

    // FUZZY MATCHING: Amount, Date, Recipient
    const amountMatches = amountsMatch(parsed.amount, expense.amount);
    const dateMatches = parsed.timestamp
      ? datesMatch(parsed.timestamp, expense.date)
      : false;
    const recipientMatches = recipientsMatch(parsed.recipient, expense.recipient);

    // Build match reasons
    if (amountMatches) matchReasons.push("Same amount");
    if (dateMatches) matchReasons.push("Within 2 days");
    if (recipientMatches) matchReasons.push("Same recipient");

    // Determine confidence level
    if (amountMatches && dateMatches && recipientMatches) {
      confidence = "likely";
    } else if (
      (amountMatches && dateMatches) ||
      (amountMatches && recipientMatches)
    ) {
      confidence = "possible";
    }

    // Only add if there's some level of match
    if (confidence !== "none") {
      matches.push({ expense, confidence, matchReasons });
    }
  }

  // Sort matches by confidence (exact > likely > possible)
  const confidenceOrder: Record<ConfidenceLevel, number> = {
    exact: 3,
    likely: 2,
    possible: 1,
    none: 0,
  };

  matches.sort((a, b) => {
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });

  const highestConfidence = matches.length > 0 ? matches[0].confidence : "none";
  const isDuplicate = matches.length > 0;

  return {
    isDuplicate,
    matches,
    highestConfidence,
  };
}

/**
 * Get a user-friendly message for the confidence level
 */
export function getConfidenceMessage(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "exact":
      return "Exact match found (same M-PESA reference)";
    case "likely":
      return "Likely duplicate (amount, date, and recipient match)";
    case "possible":
      return "Possible duplicate (some details match)";
    case "none":
      return "No duplicate found";
  }
}

/**
 * Get recommended action based on confidence level
 */
export function getRecommendedAction(
  confidence: ConfidenceLevel
): "merge" | "review" | "add" {
  switch (confidence) {
    case "exact":
      return "merge"; // Exact match, safe to merge
    case "likely":
      return "review"; // High confidence, but should review
    case "possible":
      return "review"; // Medium confidence, definitely review
    case "none":
      return "add"; // No match, safe to add
  }
}

/**
 * Batch detect duplicates for multiple parsed transactions
 */
export function detectBatchDuplicates(
  parsedTransactions: ParsedExpenseData[],
  existingExpenses: Expense[]
): Map<ParsedExpenseData, DuplicateDetectionResult> {
  const results = new Map<ParsedExpenseData, DuplicateDetectionResult>();

  for (const parsed of parsedTransactions) {
    const result = detectDuplicates(parsed, existingExpenses);
    results.set(parsed, result);
  }

  return results;
}
