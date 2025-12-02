import { parseMpesaMessage } from "./mpesa-parser";
import { parseStatementText } from "./statement-parser";
import type { ParsedExpenseData } from "@/types";

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingAnalysis {
  totalSpent: number;
  totalReceived: number;
  netFlow: number;
  transactionCount: number;
  topCategory: string;
  topSpending: number;
  avgDailySpend: number;
  avgTransactionAmount: number;
  categories: SpendingCategory[];
  transactions: ParsedTransaction[];
  dateRange: {
    start: number;
    end: number;
    days: number;
  };
}

export interface ParsedTransaction {
  amount: number;
  recipient?: string;
  type: "spend" | "receive";
  category: string;
  timestamp: number;
  description: string;
}

/**
 * Basic category matching rules based on recipient/merchant names
 */
const CATEGORY_RULES: Record<string, string[]> = {
  "Transport": [
    "uber",
    "bolt",
    "matatu",
    "taxi",
    "boda",
    "kenya bus",
    "shuttle",
    "train",
    "fuel",
    "petrol",
    "station",
  ],
  "Food & Drinks": [
    "restaurant",
    "cafe",
    "coffee",
    "pizza",
    "kfc",
    "chicken",
    "burger",
    "food",
    "hotel",
    "bar",
    "pub",
    "supermarket",
    "grocery",
    "naivas",
    "carrefour",
    "quickmart",
  ],
  "Shopping": [
    "shop",
    "store",
    "market",
    "mall",
    "jumia",
    "amazon",
    "fashion",
    "clothing",
    "electronics",
  ],
  "Entertainment": [
    "cinema",
    "movie",
    "netflix",
    "showmax",
    "spotify",
    "dstv",
    "game",
    "betting",
    "sportpesa",
    "betika",
  ],
  "Utilities": [
    "kplc",
    "kenya power",
    "water",
    "nairobi water",
    "internet",
    "safaricom",
    "airtel",
    "telkom",
    "airtime",
    "data",
  ],
  "Health": [
    "hospital",
    "clinic",
    "pharmacy",
    "doctor",
    "medical",
    "health",
  ],
  "Withdraw": ["agent", "withdraw", "atm"],
};

/**
 * Categorizes a transaction based on recipient name and type
 */
function categorizeTransaction(
  recipient: string | undefined,
  type: ParsedExpenseData["expenseType"]
): string {
  // Handle withdrawals and deposits
  if (type === "withdraw") return "Withdraw";
  if (type === "deposit") return "Deposit";
  if (type === "receive") return "Income";

  // If no recipient, categorize as "Other"
  if (!recipient) return "Other";

  const recipientLower = recipient.toLowerCase();

  // Check category rules
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => recipientLower.includes(keyword))) {
      return category;
    }
  }

  // Check for common patterns
  if (recipientLower.includes("pay") || recipientLower.includes("bill")) {
    return "Bills";
  }

  if (
    recipientLower.includes("send") ||
    recipientLower.includes("transfer") ||
    recipientLower.match(/^\d+$/)
  ) {
    return "Transfers";
  }

  return "Other";
}

/**
 * Parses SMS messages and analyzes spending patterns
 */
export function analyzeSMSMessages(smsText: string): SpendingAnalysis {
  // Split by common SMS separators
  const messages = smsText
    .split(/\n{2,}|\r\n{2,}/)
    .map((msg) => msg.trim())
    .filter((msg) => msg.length > 0);

  const transactions: ParsedTransaction[] = [];
  let totalSpent = 0;
  let totalReceived = 0;

  // Parse each message
  for (const message of messages) {
    try {
      const parsed = parseMpesaMessage(message);

      const isReceive =
        parsed.expenseType === "receive" || parsed.expenseType === "deposit";
      const isSpend = !isReceive;

      const transaction: ParsedTransaction = {
        amount: parsed.amount,
        recipient: parsed.recipient,
        type: isReceive ? "receive" : "spend",
        category: categorizeTransaction(parsed.recipient, parsed.expenseType),
        timestamp: parsed.timestamp || Date.now(),
        description: message.substring(0, 100),
      };

      transactions.push(transaction);

      if (isSpend) {
        totalSpent += parsed.amount;
      } else {
        totalReceived += parsed.amount;
      }
    } catch (error) {
      // Skip messages that can't be parsed
      console.warn("Failed to parse message:", message.substring(0, 50), error);
    }
  }

  return generateAnalysis(transactions, totalSpent, totalReceived);
}

/**
 * Parses PDF statement text and analyzes spending patterns
 */
export function analyzeStatementPDF(pdfText: string): SpendingAnalysis {
  const statementExpenses = parseStatementText(pdfText);
  const transactions: ParsedTransaction[] = [];
  let totalSpent = 0;
  let totalReceived = 0;

  for (const expense of statementExpenses) {
    // Determine if this is spending or receiving
    // Heuristic: if recipient suggests it's a deposit/transfer in, it's income
    const isReceive =
      expense.recipient.toLowerCase().includes("received") ||
      expense.recipient.toLowerCase().includes("deposit") ||
      expense.recipient.toLowerCase().includes("m-shwari transfer");

    const transaction: ParsedTransaction = {
      amount: expense.amount,
      recipient: expense.recipient,
      type: isReceive ? "receive" : "spend",
      category: categorizeTransaction(
        expense.recipient,
        isReceive ? "receive" : "send"
      ),
      timestamp: expense.timestamp,
      description: expense.description,
    };

    transactions.push(transaction);

    if (isReceive) {
      totalReceived += expense.amount;
    } else {
      totalSpent += expense.amount;
    }
  }

  return generateAnalysis(transactions, totalSpent, totalReceived);
}

/**
 * Generates comprehensive spending analysis from parsed transactions
 */
function generateAnalysis(
  transactions: ParsedTransaction[],
  totalSpent: number,
  totalReceived: number
): SpendingAnalysis {
  if (transactions.length === 0) {
    return {
      totalSpent: 0,
      totalReceived: 0,
      netFlow: 0,
      transactionCount: 0,
      topCategory: "None",
      topSpending: 0,
      avgDailySpend: 0,
      avgTransactionAmount: 0,
      categories: [],
      transactions: [],
      dateRange: {
        start: Date.now(),
        end: Date.now(),
        days: 0,
      },
    };
  }

  // Calculate date range
  const timestamps = transactions.map((t) => t.timestamp);
  const startDate = Math.min(...timestamps);
  const endDate = Math.max(...timestamps);
  const daysDiff = Math.max(
    1,
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  );

  // Group by category (only spending transactions)
  const spendingTransactions = transactions.filter((t) => t.type === "spend");
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const transaction of spendingTransactions) {
    const existing = categoryMap.get(transaction.category) || {
      amount: 0,
      count: 0,
    };
    categoryMap.set(transaction.category, {
      amount: existing.amount + transaction.amount,
      count: existing.count + 1,
    });
  }

  // Convert to array and calculate percentages
  const categories: SpendingCategory[] = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Find top category
  const topCategory =
    categories.length > 0 ? categories[0].name : "None";
  const topSpending =
    categories.length > 0 ? categories[0].amount : 0;

  // Calculate averages
  const avgDailySpend = totalSpent / daysDiff;
  const avgTransactionAmount =
    spendingTransactions.length > 0
      ? totalSpent / spendingTransactions.length
      : 0;

  return {
    totalSpent,
    totalReceived,
    netFlow: totalReceived - totalSpent,
    transactionCount: transactions.length,
    topCategory,
    topSpending,
    avgDailySpend,
    avgTransactionAmount,
    categories,
    transactions: transactions.sort((a, b) => b.timestamp - a.timestamp),
    dateRange: {
      start: startDate,
      end: endDate,
      days: daysDiff,
    },
  };
}
