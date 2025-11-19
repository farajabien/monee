import type { Transaction } from "@/types";

/**
 * Find the most common category for a given recipient
 * @param recipient - The recipient name to match
 * @param transactions - Array of transactions to search through
 * @returns The most common category name, or null if no matches found
 */
export function findMostCommonCategoryForRecipient(
  recipient: string,
  transactions: Transaction[]
): string | null {
  if (!recipient || !transactions || transactions.length === 0) {
    return null;
  }

  // Normalize recipient for matching (case-insensitive, trim whitespace)
  const normalizedRecipient = recipient.trim().toLowerCase();

  // Find all transactions with matching recipient
  const matchingTransactions = transactions.filter((tx) => {
    const txRecipient = tx.recipient?.trim().toLowerCase() || "";
    return txRecipient === normalizedRecipient;
  });

  if (matchingTransactions.length === 0) {
    return null;
  }

  // Count category occurrences
  const categoryCounts: Record<string, number> = {};
  matchingTransactions.forEach((tx) => {
    const category = tx.category || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Find the category with the highest count
  let mostCommonCategory: string | null = null;
  let maxCount = 0;

  Object.entries(categoryCounts).forEach(([category, count]) => {
    // Skip "Uncategorized" if there are other categories
    if (category === "Uncategorized" && Object.keys(categoryCounts).length > 1) {
      return;
    }
    if (count > maxCount) {
      maxCount = count;
      mostCommonCategory = category;
    }
  });

  return mostCommonCategory;
}

