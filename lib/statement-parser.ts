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
 * This version uses a robust regex to parse each line atomically,
 * improving reliability over the previous index-based method.
 *
 * @param text The raw text content from an M-Pesa statement.
 * @returns An array of parsed expense objects matching the statement_expenses schema.
 */
export function parseStatementText(text: string): StatementExpense[] {
  const expenses: StatementExpense[] = [];

  // 1. Pre-processing: Clean up the text by removing headers, footers, and page markers.
  const cleanText = text
    .replace(/Page \d+ of \d+/g, "") // Remove "Page X of Y"
    .replace(/Disclaimer:[\s\S]*?conditions apply/gi, "") // Remove footer
    .replace(
      /Receipt No\s+Completion Time\s+Details\s+(?:Transaction )?Status\s+Paid In\s+Withdrawn\s+Balance/gi,
      "" // Remove table headers
    );

  // 2. Split the text into individual transaction lines.
  // Each transaction reliably starts with a receipt number (e.g., "R...").
  const transactionLines = cleanText.split(
    /(?=R[A-Z0-9]{8,12}\s+\d{4}-\d{2}-\d{2})/
  );

  // 3. Process each line with a comprehensive regex.
  for (const line of transactionLines) {
    if (line.trim().length < 10) continue; // Skip empty or junk lines

    // This regex uses named capture groups to extract all parts of the transaction
    // in one pass. It's anchored to the start and end of the line for strictness.
    const pattern = new RegExp(
      "^(?<receiptNo>R[A-Z0-9]{8,12})s+" +
        "(?<completionTime>d{4}-d{2}-d{2}s+d{2}:d{2}:d{2})s+" +
        "(?<details>[sS]+?)s+" + // Non-greedy match for details
        "(?<status>COMPLETED|FAILED|PENDING)s+" +
        "(?<paidIn>[d,]+.d{2})s+" +
        "(?<withdrawn>[d,]+.d{2})s+" +
        "(?<balance>[d,]+.d{2})s*$", // Match until the end of the line
      "i"
    );

    const match = line
      .trim()
      .replace(/\r\n|\n/g, " ")
      .match(pattern);

    if (match?.groups) {
      const { receiptNo, completionTime, details, status, paidIn, withdrawn } =
        match.groups;

      // Skip rows that are just charges for another transaction to avoid duplicates.
      if (
        details.match(
          /(?:Charge|of Funds Charge|Pay Bill Charge|Pay Merchant Charge|Withdrawal Charge)/i
        )
      ) {
        continue;
      }

      // Only process completed transactions
      if (status.toUpperCase() !== "COMPLETED") {
        continue;
      }

      // Determine if this is a withdrawal (paid out) or deposit (paid in)
      const isWithdrawal = parseFloat(withdrawn.replace(/,/g, "")) > 0;
      const amount = isWithdrawal
        ? parseFloat(withdrawn.replace(/,/g, ""))
        : parseFloat(paidIn.replace(/,/g, ""));

      // Parse the completion time to Unix timestamp
      // Format: "2022-11-24 14:30:15"
      const timestamp = new Date(completionTime).getTime();

      // Sanitize details string to use as recipient
      const recipient = details.replace(/\s+/g, " ").trim();

      // Create full description including receipt number
      const description = `${receiptNo} - ${recipient}`;

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
