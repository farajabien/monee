import type { ParsedTransactionData } from "@/types";

/**
 * Parse Mpesa message to extract transaction details
 * Supports common Mpesa message formats
 */
export function parseMpesaMessage(message: string): ParsedTransactionData {
  const trimmed = message.trim();

  // Pattern 1: "You sent Ksh 500.00 to John Doe on 15/01/24 at 10:30 AM. New M-PESA balance is Ksh 1,000.00"
  const sentPattern =
    /You sent Ksh\s+([\d,]+\.?\d*)\s+to\s+(.+?)\s+on\s+(\d{2}\/\d{2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s+(?:AM|PM))[^.]*\.\s*(?:New M-PESA balance is Ksh\s+([\d,]+\.?\d*))?/i;

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

  if ((match = trimmed.match(sentPattern))) {
    transactionType = "send";
    recipient = match[2].trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(receivedPattern))) {
    transactionType = "receive";
    recipient = match[2].trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(buyPattern))) {
    transactionType = "buy";
    recipient = match[2].trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(withdrawPattern))) {
    transactionType = "withdraw";
    recipient = match[2].trim();
    dateStr = match[3];
    timeStr = match[4];
  } else if ((match = trimmed.match(depositPattern))) {
    transactionType = "deposit";
    recipient = match[2].trim();
    dateStr = match[3];
    timeStr = match[4];
  }

  if (!match) {
    // Fallback: try to extract just the amount
    const amountMatch = trimmed.match(/Ksh\s+([\d,]+\.?\d*)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      return {
        amount,
        transactionType: "send",
        reference: trimmed.substring(0, 100),
      };
    }
    throw new Error("Could not parse Mpesa message format");
  }

  const amountStr = match[1].replace(/,/g, "");
  const amount = parseFloat(amountStr);
  const balanceStr = match[5]?.replace(/,/g, "");
  const balance = balanceStr ? parseFloat(balanceStr) : undefined;

  // Parse date
  let timestamp: number | undefined;
  if (dateStr && timeStr) {
    try {
      const [day, month, year] = dateStr.split("/");
      const fullYear = year.length === 2 ? `20${year}` : year;
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");
      let hour24 = parseInt(hours, 10);
      if (period?.toUpperCase() === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period?.toUpperCase() === "AM" && hour24 === 12) {
        hour24 = 0;
      }

      timestamp = new Date(
        parseInt(fullYear, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        hour24,
        parseInt(minutes, 10)
      ).getTime();
    } catch (e) {
      // If date parsing fails, use current time
      timestamp = Date.now();
    }
  } else {
    timestamp = Date.now();
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

