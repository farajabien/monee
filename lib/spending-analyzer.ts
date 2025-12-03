import { parseMpesaMessage } from "./mpesa-parser";
import { parseStatementText } from "./statement-parser";
import type { ParsedExpenseData } from "@/types";
import { categorizeTransaction as smartCategorize } from "./transaction-categorizer";

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface RecipientSpending {
  recipient: string;          // Original display name
  normalizedName: string;     // For grouping/comparison
  totalAmount: number;
  transactionCount: number;
  percentage: number;         // % of total spending
  averageAmount: number;
  categories: string[];       // All categories used
  primaryCategory?: string;   // Most common category (optional)
  transactions: ParsedTransaction[];
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
  // Recipient-focused fields
  recipients: RecipientSpending[];  // Sorted by totalAmount desc
  topRecipient: string;             // Recipient with highest spending
  topRecipientSpending: number;
  uniqueRecipientCount: number;
}

export interface ParsedTransaction {
  amount: number;
  recipient: string;              // Required - display name
  normalizedRecipient: string;    // For grouping
  type: "spend" | "receive";
  category?: string;              // Optional - can be assigned later
  timestamp: number;
  description: string;
}

/**
 * Basic category matching rules based on recipient/merchant names
 */


/**
 * Normalize recipient name for grouping and comparison
 */
function normalizeRecipient(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")        // Collapse spaces
    .replace(/\b0?\d{9,10}\b/g, "") // Remove phone numbers
    .replace(/^mpesa\s+/i, "")   // Remove M-Pesa prefix
    .replace(/\s*-\s*\d+$/, "")  // Remove trailing numbers
    .trim();
}

/**
 * Clean recipient name for display
 */
function cleanRecipientName(recipient: string | undefined): string {
  if (!recipient || recipient.trim() === "") {
    return "Unknown";
  }
  
  let cleaned = recipient.trim();
  
  // Remove M-Pesa transaction codes (e.g., TKJPNAJ1D1)
  cleaned = cleaned.replace(/^[A-Z0-9]{8,12}\s+/i, "");
  
  // Remove "Confirmed" prefix
  cleaned = cleaned.replace(/^Confirmed[:.\s]+/i, "");
  
  // Remove "sent to" or "paid to" prefixes
  cleaned = cleaned.replace(/^(sent to|paid to)\s+/i, "");
  
  // Clean up M-Pesa specific terms
  cleaned = cleaned.replace(/M-PESA\s+/gi, "");
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned || "Unknown";
}

/**
 * Categorizes a transaction based on recipient name and type
 * Uses the advanced transaction-categorizer for better accuracy
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

  // Use smart categorizer
  const result = smartCategorize(recipient, "");
  
  // If confidence is high enough, use the category
  if (result.category && result.confidence > 0.3) {
    return result.category;
  }

  // Fallback to simple patterns
  const recipientLower = recipient.toLowerCase();
  
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

      const cleanedRecipient = cleanRecipientName(parsed.recipient);
      
      const transaction: ParsedTransaction = {
        amount: parsed.amount,
        recipient: cleanedRecipient,
        normalizedRecipient: normalizeRecipient(cleanedRecipient),
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

    const cleanedRecipient = cleanRecipientName(expense.recipient);
    
    const transaction: ParsedTransaction = {
      amount: expense.amount,
      recipient: cleanedRecipient,
      normalizedRecipient: normalizeRecipient(cleanedRecipient),
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
      recipients: [],
      topRecipient: "None",
      topRecipientSpending: 0,
      uniqueRecipientCount: 0,
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
    const category = transaction.category || "Other";
    const existing = categoryMap.get(category) || {
      amount: 0,
      count: 0,
    };
    categoryMap.set(category, {
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

  // Group by recipient (only spending transactions)
  const recipientMap = new Map<string, {
    displayName: string;
    amount: number;
    count: number;
    categories: Set<string>;
    transactions: ParsedTransaction[];
  }>();

  for (const transaction of spendingTransactions) {
    const normalized = transaction.normalizedRecipient;
    const existing = recipientMap.get(normalized);
    
    if (existing) {
      existing.amount += transaction.amount;
      existing.count += 1;
      if (transaction.category) {
        existing.categories.add(transaction.category);
      }
      existing.transactions.push(transaction);
    } else {
      recipientMap.set(normalized, {
        displayName: transaction.recipient,
        amount: transaction.amount,
        count: 1,
        categories: transaction.category ? new Set([transaction.category]) : new Set(),
        transactions: [transaction],
      });
    }
  }

  // Convert to array and calculate recipient stats
  const recipients: RecipientSpending[] = Array.from(recipientMap.entries())
    .map(([normalized, data]) => {
      // Determine primary category (most common)
      const categoryCounts = new Map<string, number>();
      data.transactions.forEach(t => {
        if (t.category) {
          categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
        }
      });
      
      const primaryCategory = categoryCounts.size > 0
        ? Array.from(categoryCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

      return {
        recipient: data.displayName,
        normalizedName: normalized,
        totalAmount: data.amount,
        transactionCount: data.count,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
        averageAmount: data.amount / data.count,
        categories: Array.from(data.categories),
        primaryCategory,
        transactions: data.transactions.sort((a, b) => b.timestamp - a.timestamp),
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Find top recipient
  const topRecipient = recipients.length > 0 ? recipients[0].recipient : "None";
  const topRecipientSpending = recipients.length > 0 ? recipients[0].totalAmount : 0;
  const uniqueRecipientCount = recipients.length;

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
    // Recipient-focused data
    recipients,
    topRecipient,
    topRecipientSpending,
    uniqueRecipientCount,
  };
}
