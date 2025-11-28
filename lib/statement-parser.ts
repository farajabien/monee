export interface StatementExpense {
  receiptNo: string;
  completionTime: string;
  details: string;
  status: string;
  paidIn: number;
  withdrawn: number;
  balance: number;
}

/**
 * Parses M-Pesa statement text (from PDF or copy-paste) into structured data.
 * This version uses a robust regex to parse each line atomically,
 * improving reliability over the previous index-based method.
 *
 * @param text The raw text content from an M-Pesa statement.
 * @returns An array of parsed expense objects.
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
      "^(?<receiptNo>R[A-Z0-9]{8,12})\s+" +
        "(?<completionTime>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+" +
        "(?<details>[\s\S]+?)\s+" + // Non-greedy match for details
        "(?<status>COMPLETED|FAILED|PENDING)\s+" +
        "(?<paidIn>[\d,]+\.\d{2})\s+" +
        "(?<withdrawn>[\d,]+\.\d{2})\s+" +
        "(?<balance>[\d,]+\.\d{2})\s*$", // Match until the end of the line
      "i"
    );

    const match = line.trim().replace(/\r\n|\n/g, " ").match(pattern);

    if (match?.groups) {
      const {
        receiptNo,
        completionTime,
        details,
        status,
        paidIn,
        withdrawn,
        balance,
      } = match.groups;

      // Skip rows that are just charges for another transaction to avoid duplicates.
      if (
        details.match(
          /(?:Charge|of Funds Charge|Pay Bill Charge|Pay Merchant Charge|Withdrawal Charge)/i
        )
      ) {
        continue;
      }

      expenses.push({
        receiptNo,
        completionTime,
        details: details.replace(/\s+/g, " ").trim(), // Sanitize details string
        status: status.toUpperCase(),
        paidIn: parseFloat(paidIn.replace(/,/g, "")),
        withdrawn: parseFloat(withdrawn.replace(/,/g, "")),
        balance: parseFloat(balance.replace(/,/g, "")),
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
export function convertStatementToMessages(expenses: StatementExpense[]): string[] {
  return expenses
    .filter(exp => exp.status === 'COMPLETED')
    .map(exp => {
      // Determine if this is a withdrawal (paid out) or deposit (paid in)
      const isWithdrawal = exp.withdrawn > 0;
      const amount = isWithdrawal ? exp.withdrawn : exp.paidIn;

      // Parse the completion time to extract date and time components
      // Format: "2022-11-24 14:30:15" → "24/11/22" and "02:30 PM"
      const [datePart, timePart] = exp.completionTime.split(' ');
      const [year, month, day] = datePart.split('-');
      const shortYear = year.slice(-2);
      const dateStr = `${day}/${month}/${shortYear}`;

      // Convert 24-hour time to 12-hour with AM/PM
      const [hours, minutes] = timePart.split(':');
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const timeStr = `${hour12}:${minutes} ${isPM ? 'PM' : 'AM'}`;

      // Format the message to match M-Pesa SMS format
      // Example: "TKJPNAJ1D1 Confirmed. Ksh200.00 sent to John Doe on 19/11/25 at 02:30 PM. New M-PESA balance is Ksh5,000.00."
      const action = isWithdrawal ? 'sent to' : 'received from';
      const message = `${exp.receiptNo} Confirmed. Ksh${amount.toFixed(2)} ${action} ${exp.details} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${exp.balance.toFixed(2)}.`;

      return message;
    });
}
