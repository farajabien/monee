import type { Expense } from "@/types";

/**
 * Normalize a recipient name for matching
 */
function normalizeRecipientName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      // Remove extra spaces
      .replace(/\s+/g, " ")
      // Remove phone numbers
      .replace(/\b0?\d{9,10}\b/g, "")
      .trim()
  );
}

/**
 * Check if two recipient names match (fuzzy matching)
 */
function recipientsMatch(recipient1: string, recipient2: string): boolean {
  const norm1 = normalizeRecipientName(recipient1);
  const norm2 = normalizeRecipientName(recipient2);

  // Exact match
  if (norm1 === norm2) return true;

  // Check if one is contained in the other (for cases like "John" vs "John Doe")
  if (norm1.length >= 3 && norm2.length >= 3) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  }

  return false;
}

/**
 * Find the most common category for a given recipient
 * @param recipient - The recipient name to match
 * @param expenses - Array of expenses to search through
 * @returns The most common category name, or null if no matches found
 */
export function findMostCommonCategoryForRecipient(
  recipient: string,
  expenses: Expense[]
): string | null {
  if (!recipient || !expenses || expenses.length === 0) {
    return null;
  }

  // Find all expenses with matching recipient (fuzzy match)
  const matchingExpenses = expenses.filter((tx) => {
    const txRecipient = tx.recipient || "";
    if (!txRecipient) return false;
    return recipientsMatch(recipient, txRecipient);
  });

  if (matchingExpenses.length === 0) {
    return null;
  }

  // Count category occurrences
  const categoryCounts: Record<string, number> = {};
  matchingExpenses.forEach((tx) => {
    const category = tx.category || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Find the category with the highest count
  let mostCommonCategory: string | null = null;
  let maxCount = 0;

  Object.entries(categoryCounts).forEach(([category, count]) => {
    // Skip "Uncategorized" if there are other categories
    if (
      category === "Uncategorized" &&
      Object.keys(categoryCounts).length > 1
    ) {
      return;
    }
    if (count > maxCount) {
      maxCount = count;
      mostCommonCategory = category;
    }
  });

  return mostCommonCategory;
}
