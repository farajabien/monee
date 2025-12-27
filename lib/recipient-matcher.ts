import type { Expense, ParsedExpenseData } from "@/types";

export interface RecipientMatch {
  confidence: "high" | "medium" | "low";
  recipientId?: string;
  recipientName: string;
  matchedBy: "phone-exact" | "phone-partial" | "name-fuzzy" | "none";
  suggestedCategory?: string;
  categoryConfidence?: number;
}

/**
 * Match phone numbers, handling partial matches from statements
 * 
 * Examples:
 * - "0712345678" matches "0712345678" (exact)
 * - "0729***950" matches "0712345678" (partial from statement)
 */
function matchPhoneNumber(
  incoming: string,
  existing: string
): { match: boolean; isPartial: boolean } {
  if (!incoming || !existing) {
    return { match: false, isPartial: false };
  }
  
  // Exact match
  if (incoming === existing) {
    return { match: true, isPartial: false };
  }
  
  // Partial match (statement with asterisks)
  const hasAsterisks = incoming.includes("*") || existing.includes("*");
  if (hasAsterisks) {
    // Compare only the visible digits
    const incomingDigits = incoming.split("");
    const existingDigits = existing.split("");
    
    if (incomingDigits.length !== existingDigits.length) {
      return { match: false, isPartial: false };
    }
    
    let matches = true;
    for (let i = 0; i < incomingDigits.length; i++) {
      const inChar = incomingDigits[i];
      const exChar = existingDigits[i];
      
      // Skip asterisks
      if (inChar === "*" || exChar === "*") continue;
      
      // Compare actual digits
      if (inChar !== exChar) {
        matches = false;
        break;
      }
    }
    
    return { match: matches, isPartial: true };
  }
  
  return { match: false, isPartial: false };
}

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(
            Math.min(newValue, lastValue),
            costs[j]
          ) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;
  
  const distance = costs[s2.length];
  return ((maxLength - distance) / maxLength) * 100;
}

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

/**
 * Match incoming expense to existing recipients using phone and name
 * 
 * Priority order:
 * 1. Exact phone match (highest confidence)
 * 2. Partial phone match (high confidence if statement)
 * 3. Fuzzy name match >80% (medium confidence)
 * 4. Fuzzy name match 60-80% (low confidence)
 * 5. No match (new recipient)
 */
export function matchRecipient(
  parsed: ParsedExpenseData,
  existingExpenses: Expense[]
): RecipientMatch {
  const incomingName = parsed.recipient?.trim() || "";
  const incomingPhone = parsed.phoneNumber?.trim();
  
  // No data to match
  if (!incomingName && !incomingPhone) {
    return {
      confidence: "low",
      recipientName: "Unknown",
      matchedBy: "none",
    };
  }
  
  // Try phone number match first (most reliable)
  if (incomingPhone) {
    for (const expense of existingExpenses) {
      // Check if expense has phone number in rawMessage or notes
      // Check if expense has phone number in notes
      const expensePhone = expense.notes?.match(/(\d{10})/)?.[1];
      
      if (!expensePhone) continue;
      
      const phoneMatch = matchPhoneNumber(incomingPhone, expensePhone);
      
      if (phoneMatch.match) {
        const suggestedCategory = findMostCommonCategoryForRecipient(
          expense.recipient || "",
          existingExpenses
        );
        
        // Calculate category confidence
        const categoryCount = existingExpenses.filter(
          (e) => e.recipient === expense.recipient && e.category === suggestedCategory
        ).length;
        const totalCount = existingExpenses.filter(
          (e) => e.recipient === expense.recipient
        ).length;
        const categoryConfidence = totalCount > 0 ? (categoryCount / totalCount) * 100 : 0;
        
        return {
          confidence: "high",
          recipientId: expense.id,
          recipientName: expense.recipient || "Unknown",
          matchedBy: phoneMatch.isPartial ? "phone-partial" : "phone-exact",
          suggestedCategory: suggestedCategory || undefined,
          categoryConfidence,
        };
      }
    }
  }
  
  // Try fuzzy name match
  if (incomingName) {
    let bestMatch: {
      expense: Expense;
      similarity: number;
    } | null = null;
    
    for (const expense of existingExpenses) {
      const similarity = calculateSimilarity(incomingName, expense.recipient || "");
      
      if (similarity > 60 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { expense, similarity };
      }
    }
    
    if (bestMatch) {
      const suggestedCategory = findMostCommonCategoryForRecipient(
        bestMatch.expense.recipient || "",
        existingExpenses
      );
      
      // Calculate category confidence
      const categoryCount = existingExpenses.filter(
        (e) => e.recipient === bestMatch.expense.recipient && e.category === suggestedCategory
      ).length;
      const totalCount = existingExpenses.filter(
        (e) => e.recipient === bestMatch.expense.recipient
      ).length;
      const categoryConfidence = totalCount > 0 ? (categoryCount / totalCount) * 100 : 0;
      
      return {
        confidence: bestMatch.similarity >= 80 ? "medium" : "low",
        recipientId: bestMatch.expense.id,
        recipientName: bestMatch.expense.recipient || "Unknown",
        matchedBy: "name-fuzzy",
        suggestedCategory: suggestedCategory || undefined,
        categoryConfidence,
      };
    }
  }
  
  // No match found - new recipient
  return {
    confidence: "low",
    recipientName: incomingName || incomingPhone || "Unknown",
    matchedBy: "none",
  };
}

/**
 * Batch match multiple expenses
 * Useful for bulk imports
 */
export function batchMatchRecipients(
  parsedExpenses: ParsedExpenseData[],
  existingExpenses: Expense[]
): RecipientMatch[] {
  return parsedExpenses.map((parsed) =>
    matchRecipient(parsed, existingExpenses)
  );
}
