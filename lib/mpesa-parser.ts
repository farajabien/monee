import type { ParsedTransactionData } from "@/types";

/**
 * Parse Mpesa message to extract transaction details
 * Supports common Mpesa message formats with robust error handling
 */
export function parseMpesaMessage(message: string): ParsedTransactionData {
  if (!message || typeof message !== "string") {
    throw new Error("Invalid message: message must be a non-empty string");
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error("Invalid message: message cannot be empty");
  }

  // Pattern 1: "You sent Ksh 500.00 to John Doe on 15/01/24 at 10:30 AM. New M-PESA balance is Ksh 1,000.00"
  const sentPattern =
    /You sent Ksh\s+([\d,]+\.?\d*)\s+to\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))[^.]*\.\s*(?:New M-PESA balance is Ksh\s+([\d,]+\.?\d*))?/i;

  // Pattern 1b: "TKJPNAJ1D1 Confirmed. Ksh200.00 sent to/paid to recipient on 19/11/25 at 6:32 PM. New M-PESA balance is Ksh87.48."
  // Handles both "sent to" and "paid to", optional period after recipient, optional space before "New M-PESA"
  const confirmedSentPattern =
    /[A-Z0-9]+\s+Confirmed\.\s+Ksh([\d,]+\.?\d*)\s+(?:sent to|paid to)\s+(.+?)\s*\.?\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))\.?\s*(?:New M-PESA balance is Ksh\s+([\d,]+\.?\d*))?/i;

  // Pattern 1c: M-Shwari Transfer - "TKLPNAOE55 Confirmed.Ksh450.00 transferred from M-Shwari account on 21/11/25 at 1:04 PM"
  const mshwariTransferPattern =
    /[A-Z0-9]+\s+Confirmed\.?\s*Ksh([\d,]+\.?\d*)\s+transferred from M-Shwari account on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))(?:.*?M-PESA balance is Ksh\s*([.,\d]+))?/i;

  // Pattern 2: "You received Ksh 1,000.00 from Jane Doe on 15/01/24 at 2:00 PM. New M-PESA balance is Ksh 1,500.00"
  const receivedPattern =
    /You received Ksh\s+([\d,]+\.?\d*)\s+from\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))[^.]*\.\s*(?:New M-PESA balance is Ksh\s+([\d,]+\.?\d*))?/i;

  // Pattern 3: "You bought goods worth Ksh 500.00 from Shop Name on 15/01/24 at 10:30 AM"
  const buyPattern =
    /You bought goods worth Ksh\s+([\d,]+\.?\d*)\s+from\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i;

  // Pattern 4: "You withdrew Ksh 500.00 from Agent Name on 15/01/24 at 10:30 AM"
  const withdrawPattern =
    /You withdrew Ksh\s+([\d,]+\.?\d*)\s+from\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i;

  // Pattern 5: "You deposited Ksh 500.00 at Agent Name on 15/01/24 at 10:30 AM"
  const depositPattern =
    /You deposited Ksh\s+([\d,]+\.?\d*)\s+at\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i;

  let match: RegExpMatchArray | null = null;
  let transactionType: ParsedTransactionData["transactionType"] = "send";
  let recipient: string | undefined;
  let dateStr: string | undefined;
  let timeStr: string | undefined;

  if ((match = trimmed.match(mshwariTransferPattern))) {
    transactionType = "receive";
    recipient = "M-Shwari Transfer";
    dateStr = match[2];
    timeStr = match[3];
    // Balance is at match[4] if present
  } else if ((match = trimmed.match(confirmedSentPattern))) {
    transactionType = "send";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(sentPattern))) {
    transactionType = "send";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(receivedPattern))) {
    transactionType = "receive";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(buyPattern))) {
    transactionType = "buy";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(withdrawPattern))) {
    transactionType = "withdraw";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(depositPattern))) {
    transactionType = "deposit";
    recipient = match[2]?.trim();
    dateStr = match[3];
    timeStr = match[4];
  }

  if (!match) {
    // Fallback: try to extract just the amount
    const amountMatch = trimmed.match(/Ksh\s+([\d,]+\.?\d*)/i);
    if (amountMatch && amountMatch[1]) {
      const amountStr = amountMatch[1].replace(/,/g, "");
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount: amount must be a positive number");
      }

      return {
        amount,
        transactionType: "send",
        reference: trimmed.substring(0, 100),
        timestamp: Date.now(),
      };
    }
    throw new Error(
      "Could not parse Mpesa message format: no recognizable pattern found"
    );
  }

  // Parse and validate amount
  if (!match[1]) {
    throw new Error("Invalid message: amount not found");
  }

  const amountStr = match[1].replace(/,/g, "");
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    throw new Error(
      `Invalid amount: "${match[1]}" is not a valid positive number`
    );
  }

  // Parse balance if present
  let balance: number | undefined;
  // For M-Shwari transfers, balance is at index 4, for others at index 5
  const balanceIndex = trimmed.match(mshwariTransferPattern) ? 4 : 5;
  if (match[balanceIndex]) {
    const balanceStr = match[balanceIndex].replace(/[,\s]/g, "");
    const parsedBalance = parseFloat(balanceStr);
    if (!isNaN(parsedBalance) && parsedBalance >= 0) {
      balance = parsedBalance;
    }
  }

  // Parse date with robust error handling
  let timestamp: number | undefined;
  if (dateStr && timeStr) {
    try {
      const dateParts = dateStr.split("/");
      const timeParts = timeStr.split(" ");

      if (dateParts.length !== 3 || timeParts.length !== 2) {
        throw new Error("Invalid date/time format");
      }

      const [day, month, year] = dateParts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const [time, period] = timeParts;
      const [hours, minutes] = time.split(":");

      if (!hours || !minutes) {
        throw new Error("Invalid time format");
      }

      let hour24 = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(fullYear, 10);

      // Validate parsed values
      if (
        isNaN(hour24) ||
        isNaN(minute) ||
        isNaN(dayNum) ||
        isNaN(monthNum) ||
        isNaN(yearNum) ||
        hour24 < 1 ||
        hour24 > 12 ||
        minute < 0 ||
        minute > 59 ||
        dayNum < 1 ||
        dayNum > 31 ||
        monthNum < 1 ||
        monthNum > 12 ||
        yearNum < 2000 ||
        yearNum > 2100
      ) {
        throw new Error("Date/time values out of valid range");
      }

      // Convert 12-hour to 24-hour format
      const periodUpper = period?.toUpperCase();
      if (periodUpper === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (periodUpper === "AM" && hour24 === 12) {
        hour24 = 0;
      }

      const parsedDate = new Date(
        yearNum,
        monthNum - 1,
        dayNum,
        hour24,
        minute
      );

      // Validate the constructed date
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date constructed");
      }

      timestamp = parsedDate.getTime();
    } catch (error) {
      // If date parsing fails, use current time and log the error
      console.warn("Failed to parse date/time, using current time:", error);
      timestamp = Date.now();
    }
  } else {
    timestamp = Date.now();
  }

  // Clean up recipient name
  if (recipient) {
    recipient = recipient.trim();
    // Remove any trailing periods or special characters
    recipient = recipient.replace(/[.\s]+$/, "");
    if (recipient.length === 0) {
      recipient = undefined;
    }
  }

  return {
    amount,
    recipient,
    transactionType,
    balance,
    timestamp,
    reference: trimmed.substring(0, 100),
  };
}
