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
function normalizeText(input: string): string {
  let t = input.replace(/[\t\f\r]+/g, " ");
  // collapse multiple spaces
  t = t.replace(/ +/g, " ");
  // normalize common header labels
  t = t.replace(/Withdrawn/gi, "Withdraw");
  t = t.replace(/Transaction\s+Status/gi, "Status");
  return t;
}

function stripHeadersAndFooters(input: string): string {
  return input
    // table header (case-insensitive, flexible spacing)
    .replace(
      /Receipt\s+No\s+Completion\s+Time\s+Details\s+(?:Transaction\s+)?Status\s+Paid\s+In\s+Withdraw\s+Balance/gi,
      ""
    )
    // page markers
    .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
    // disclaimers
    .replace(/Disclaimer:[\s\S]*?(?:conditions apply|Terms and Conditions)/gi, "")
    // social/footer lines
    .replace(/@Safaricom.*$/gmi, "");
}

function toAmount(val?: string): number {
  if (!val) return 0;
  const v = val.trim();
  if (v === "-" || v === "" || v === "0.00") return 0;
  // remove thousand separators
  const num = parseFloat(v.replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function parseRow(chunk: string): StatementExpense | null {
  const rowRe = /^(?<receipt>R[A-Z0-9]{8,12})\s+(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2}(?::\d{2})?)\s+(?<details>.+?)\s+(?<status>COMPLETED|FAILED|PENDING)\s+(?<paidIn>[\d,]+\.\d{2}|0\.00|-)?\s+(?<withdraw>[\d,]+\.\d{2}|0\.00|-)?\s+(?<balance>[\d,]+\.\d{2})\b/i;
  const m = chunk.match(rowRe);
  if (!m || !m.groups) return null;
  const { date, time, details, status, paidIn, withdraw } = m.groups as Record<string, string>;
  const paidInNum = toAmount(paidIn);
  const withdrawNum = toAmount(withdraw);
  const ts = Date.parse(`${date} ${time}`);
  const isCompleted = /COMPLETED/i.test(status);
  if (!isCompleted) return null;

  // Determine direction: spending when Withdraw > 0, else income
  const amount = withdrawNum > 0 ? withdrawNum : paidInNum;
  if (amount === 0) return null;
  
  const recipient = details.trim();
  return {
    amount,
    recipient,
    timestamp: isNaN(ts) ? Date.now() : ts,
    description: recipient,
    category: undefined,
    isProcessed: false,
    createdAt: Date.now(),
  };
}

export function parseStatementText(pdfText: string): StatementExpense[] {
  if (!pdfText || pdfText.trim().length === 0) return [];

  // Pre-normalize and clean
  const normalized = stripHeadersAndFooters(normalizeText(pdfText));

  // Split by receipt + date/time anchors, keeping the anchor on each chunk
  const parts = normalized
    .split(/(?=R[A-Z0-9]{8,12}\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const rows: StatementExpense[] = [];
  for (const part of parts) {
    const expense = parseRow(part);
    if (expense && expense.amount > 0) {
      rows.push(expense);
    }
  }

  return rows;
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
