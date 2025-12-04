export interface StatementExpense {
  amount: number;
  recipient: string;
  timestamp: number;
  description: string;
  category?: string;
  isProcessed: boolean;
  createdAt: number;
}

/**
 * Parses M-Pesa statement text (from PDF or copy-paste) into structured data.
 * Updated to match actual M-Pesa statement format with table structure:
 * Receipt No | Completion Time | Details | Transaction Status | Paid In | Withdraw | Balance
 *
 * @param text The raw text content from an M-Pesa statement.
 * @returns An array of parsed expense objects.
 */
export function parseStatementText(text: string): StatementExpense[] {
  const expenses: StatementExpense[] = [];

  console.log("[Statement Parser] Starting parse. Text length:", text.length);
  console.log("[Statement Parser] First 200 chars:", text.substring(0, 200));

  // Clean up the text - but keep the transaction data!
  const cleanText = text
    .replace(/Page \d+ of \d+/g, "")
    .replace(/Disclaimer:[\s\S]*?conditions apply/gi, "")
    .replace(/Twitter:.*?conditions apply/gi, "")
    .replace(/MPESA FULL STATEMENT/g, "")
    .replace(/Customer Name:.*?\n/g, "")
    .replace(/Mobile Number:.*?\n/g, "")
    .replace(/Date of Statement:.*?\n/g, "")
    .replace(/Statement Period:.*?\n/g, "")
    .replace(/SUMMARY[\s\S]*?(?=DETAILED STATEMENT|Receipt No)/i, "") // Only remove summary section, not transaction data
    .replace(/DETAILED STATEMENT/gi, "")
    .replace(/TRANSACTION TYPE\s+PAID IN\s+PAID OUT[\s\S]*?TOTAL:/gi, "") // Remove summary table from first page
    .replace(/Receipt No\s+Completion Time\s+Details\s+Transaction Status\s+Paid [Ii]n\s+Withdraw\s+Balance/gi, ""); // Remove table headers

  console.log("[Statement Parser] After cleaning, length:", cleanText.length);
  console.log("[Statement Parser] Sample cleaned text:", cleanText.substring(0, 500));

  // Split by receipt number pattern since PDF extraction doesn't preserve newlines properly
  // Receipt numbers look like: REM1760VPH, REO2BUMKYX, REL44PCYVS, etc.
  const receiptPattern = /\b(RE[A-Z0-9]{6,12})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
  const transactions: Array<{ receiptNo: string; timestamp: string; text: string }> = [];
  
  let match;
  let lastIndex = 0;
  let lastReceipt: { receiptNo: string; timestamp: string; startIndex: number } | null = null;
  
  while ((match = receiptPattern.exec(cleanText)) !== null) {
    if (lastReceipt) {
      // Save the previous transaction
      transactions.push({
        receiptNo: lastReceipt.receiptNo,
        timestamp: lastReceipt.timestamp,
        text: cleanText.substring(lastReceipt.startIndex, match.index).trim()
      });
    }
    lastReceipt = {
      receiptNo: match[1],
      timestamp: match[2],
      startIndex: match.index
    };
  }
  
  // Add the last transaction
  if (lastReceipt) {
    transactions.push({
      receiptNo: lastReceipt.receiptNo,
      timestamp: lastReceipt.timestamp,
      text: cleanText.substring(lastReceipt.startIndex).trim()
    });
  }
  
  console.log("[Statement Parser] Total transactions found:", transactions.length);
  console.log("[Statement Parser] Sample transactions:", transactions.slice(0, 3).map(t => ({
    receipt: t.receiptNo,
    preview: t.text.substring(0, 80)
  })));

  // Pattern to extract transaction details
  // Format: RECEIPT_NO TIMESTAMP Details COMPLETED/FAILED PAID_IN WITHDRAW BALANCE
  // Example: "REM1760VPH 2023-05-22 20:23:26 Customer Transfer of Funds Charge COMPLETED 0.00 12.00 47.69"
  
  for (const transaction of transactions) {
    const { receiptNo, timestamp: completionTime, text: transactionText } = transaction;
    
    // The text starts with receipt and timestamp, so we need to extract what comes after
    // Pattern: RECEIPT TIMESTAMP Details STATUS PAID_IN WITHDRAW BALANCE
    const fullPattern = new RegExp(
      `^${receiptNo}\\s+${completionTime.replace(/[-:]/g, '\\$&')}\\s+(.+?)\\s+(COMPLETED|FAILED|PENDING)\\s+([\\d,]+\\.?\\d{0,2})\\s+([\\d,]+\\.?\\d{0,2})\\s+([\\d,]+\\.?\\d{0,2})`,
      'i'
    );
    
    const match = transactionText.match(fullPattern);
    
    if (!match) {
      console.log("[Statement Parser] No match for transaction:", transactionText.substring(0, 100));
      continue;
    }
    
    const details = match[1].trim();
    const status = match[2];
    const paidIn = match[3];
    const withdraw = match[4];
    const balance = match[5];
    
    // Skip charge transactions to avoid duplicates
    if (details.match(/(?:Charge|Funds Charge)\s*$/i)) {
      continue;
    }
    
    // Only process completed transactions
    if (status.toUpperCase() !== "COMPLETED") {
      continue;
    }
    
    // Determine amount - use withdraw amount (paid out) for expenses
    const withdrawAmount = parseFloat(withdraw.replace(/,/g, ""));
    const paidInAmount = parseFloat(paidIn.replace(/,/g, ""));
    
    // Only include withdrawals (expenses), skip deposits/received money
    if (withdrawAmount <= 0) {
      continue;
    }
    
    const amount = withdrawAmount;
    
    // Parse timestamp
    const timestamp = new Date(completionTime).getTime();
    
    // Clean up recipient/details
    const recipient = details
      .replace(/\s+/g, " ")
      .replace(/Customer Transfer (to|of Funds Charge)\s*/gi, "")
      .replace(/Pay Bill (to|Charge)\s*/gi, "")
      .replace(/Airtime Purchase\s*/gi, "Airtime")
      .replace(/Merchant Payment to\s*/gi, "")
      .replace(/M-Shwari (Withdraw|Deposit)\s*/gi, "M-Shwari")
      .replace(/Funds received from\s*/gi, "")
      .trim();
    
    const description = `${receiptNo} - ${details}`;
    
    expenses.push({
      amount,
      recipient,
      timestamp,
      description,
      category: undefined,
      isProcessed: false,
      createdAt: Date.now(),
    });
  }

  console.log("[Statement Parser] Successfully parsed", expenses.length, "expenses");
  if (expenses.length > 0) {
    console.log("[Statement Parser] First expense:", expenses[0]);
  }
  
  return expenses;
}

/**
 * Converts an array of parsed StatementExpense objects into M-Pesa message format strings.
 * This allows statement transactions to be processed by the same parser as SMS messages.
 *
 * @param expenses Array of parsed statement expenses.
 * @returns Array of M-Pesa formatted message strings.
 */
export function convertStatementToMessages(
  expenses: StatementExpense[]
): string[] {
  return expenses
    .filter((exp) => !exp.isProcessed)
    .map((exp) => {
      // Parse the timestamp to extract date and time components
      const date = new Date(exp.timestamp);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);
      const dateStr = `${day}/${month}/${year}`;

      // Convert to 12-hour time with AM/PM
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const isPM = hours >= 12;
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const timeStr = `${hour12}:${minutes} ${isPM ? "PM" : "AM"}`;

      // Extract receipt number from description if present
      const receiptMatch = exp.description.match(/^(R[A-Z0-9]{8,12})/);
      const receiptNo = receiptMatch ? receiptMatch[1] : "UNKNOWN";

      // Format the message to match M-Pesa SMS format
      // Example: "TKJPNAJ1D1 Confirmed. Ksh200.00 sent to John Doe on 19/11/25 at 02:30 PM. New M-PESA balance is Ksh5,000.00."
      const message = `${receiptNo} Confirmed. Ksh${exp.amount.toFixed(
        2
      )} sent to ${exp.recipient} on ${dateStr} at ${timeStr}.`;

      return message;
    });
}
