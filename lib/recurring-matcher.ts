import type { ParsedExpenseData, RecurringTransaction } from "@/types";

export interface RecurringMatch {
  confidence: "high" | "medium" | "low";
  recurringExpenseId?: string;
  expenseName: string;
  expectedAmount?: number;
  lastPaidDate?: number;
  frequency?: "weekly" | "monthly" | "quarterly" | "yearly";
  matchScore: number;
}

/**
 * Calculate if an amount is within tolerance
 * 
 * Examples:
 * - amount: 2500, expected: 2500, tolerance: 0.1 → true (exact)
 * - amount: 2550, expected: 2500, tolerance: 0.1 → true (within 10%)
 * - amount: 2900, expected: 2500, tolerance: 0.1 → false (too different)
 */
function isAmountWithinTolerance(
  amount: number,
  expectedAmount: number,
  tolerance: number = 0.1
): boolean {
  const difference = Math.abs(amount - expectedAmount);
  const threshold = expectedAmount * tolerance;
  return difference <= threshold;
}

/**
 * Check if expense is due based on frequency and last paid date
 * 
 * Returns a score:
 * - 1.0: Due now or overdue
 * - 0.5-0.9: Due soon (within grace period)
 * - 0.0-0.4: Not due yet
 */
function calculateDueScore(
  lastPaidDate: number | undefined,
  frequency: string | undefined,
  currentDate: number = Date.now()
): number {
  if (!lastPaidDate || !frequency) return 0.5; // Unknown, give medium score

  const daysSinceLastPaid = (currentDate - lastPaidDate) / (1000 * 60 * 60 * 24);

  // Expected days between payments
  const expectedDays: Record<string, number> = {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };

  const expected = expectedDays[frequency] || 30;
  const gracePeriod = expected * 0.2; // 20% grace period

  if (daysSinceLastPaid >= expected) {
    return 1.0; // Due or overdue
  } else if (daysSinceLastPaid >= expected - gracePeriod) {
    return 0.8; // Due soon
  } else {
    // Scale from 0 to 0.6 based on how close to due date
    return (daysSinceLastPaid / expected) * 0.6;
  }
}

/**
 * Match expense to recurring expenses
 * 
 * Matching logic:
 * 1. Same recipient (using normalized name)
 * 2. Same category
 * 3. Similar amount (within 10% tolerance)
 * 4. Due date appropriate for frequency
 * 
 * Score calculation:
 * - Recipient match: 40 points
 * - Category match: 20 points
 * - Amount match: 20 points
 * - Due date score: 20 points
 * 
 * Confidence levels:
 * - High: 80+ points
 * - Medium: 60-79 points
 * - Low: 40-59 points
 */
export function matchRecurringExpense(
  parsed: ParsedExpenseData,
  matchedRecipientName: string,
  suggestedCategory: string | undefined,
  recurringExpenses: RecurringTransaction[]
): RecurringMatch {
  if (!recurringExpenses || recurringExpenses.length === 0) {
    return {
      confidence: "low",
      expenseName: matchedRecipientName,
      matchScore: 0,
    };
  }

  let bestMatch: {
    expense: RecurringTransaction;
    score: number;
  } | null = null;

  for (const recurring of recurringExpenses) {
    let score = 0;

    // 1. Recipient match (40 points)
    const recipientMatch =
      recurring.recipient.toLowerCase() === matchedRecipientName.toLowerCase();
    if (recipientMatch) {
      score += 40;
    } else {
      // Partial recipient match
      const recipientContains =
        recurring.recipient.toLowerCase().includes(matchedRecipientName.toLowerCase()) ||
        matchedRecipientName.toLowerCase().includes(recurring.recipient.toLowerCase());
      if (recipientContains) {
        score += 20;
      }
    }

    // 2. Category match (20 points)
    if (suggestedCategory && recurring.category === suggestedCategory) {
      score += 20;
    }

    // 3. Amount match (20 points)
    if (parsed.amount && recurring.amount) {
      if (isAmountWithinTolerance(parsed.amount, recurring.amount)) {
        score += 20;
      } else if (isAmountWithinTolerance(parsed.amount, recurring.amount, 0.2)) {
        score += 10; // Within 20% tolerance, partial points
      }
    }

    // 4. Due date score (20 points)
    const dueScore = calculateDueScore(
      recurring.lastPaidDate,
      recurring.frequency
    );
    score += dueScore * 20;

    // Track best match
    if (score >= 40 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { expense: recurring, score };
    }
  }

  // Return best match or no match
  if (bestMatch) {
    const confidence =
      bestMatch.score >= 80
        ? "high"
        : bestMatch.score >= 60
        ? "medium"
        : "low";

    return {
      confidence,
      recurringExpenseId: bestMatch.expense.id,
      expenseName: bestMatch.expense.recipient,
      expectedAmount: bestMatch.expense.amount,
      lastPaidDate: bestMatch.expense.lastPaidDate,
      frequency: bestMatch.expense.frequency as "weekly" | "monthly" | "quarterly" | "yearly" | undefined,
      matchScore: Math.round(bestMatch.score),
    };
  }

  return {
    confidence: "low",
    expenseName: matchedRecipientName,
    matchScore: 0,
  };
}

/**
 * Batch match multiple expenses to recurring
 */
export function batchMatchRecurring(
  parsedExpenses: Array<{
    parsed: ParsedExpenseData;
    matchedRecipientName: string;
    suggestedCategory?: string;
  }>,
  recurringExpenses: RecurringTransaction[]
): RecurringMatch[] {
  return parsedExpenses.map(({ parsed, matchedRecipientName, suggestedCategory }) =>
    matchRecurringExpense(parsed, matchedRecipientName, suggestedCategory, recurringExpenses)
  );
}
