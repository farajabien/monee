
export interface StatementTransaction {
  receiptNo: string;
  completionTime: string;
  details: string;
  status: string;
  paidIn: number;
  withdrawn: number;
  balance: number;
}
/**
 * Parse M-Pesa statement text (from PDF or copy-paste)
 * Handles the tabular format from M-Pesa Full Statement
 */
export function parseStatementText(text: string): StatementTransaction[] {
  const transactions: StatementTransaction[] = [];
  
  console.log(`Parsing statement: ${text.length} chars`);
  
  // Remove page headers and footers
  text = text.replace(/Page \d+ of \d+/g, '');
  text = text.replace(/Disclaimer:[\s\S]*?conditions apply/gi, '');
  text = text.replace(/Receipt No\s+Completion Time\s+Details\s+Transaction Status\s+Paid in\s+Withdraw\s*n?\s+Balance/gi, '');
  
  // Split by receipt numbers to identify transaction boundaries
  const receiptPattern = /(RE[A-Z0-9]{8,12})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
  
  let match;
  const potentialTransactions: Array<{receipt: string; timestamp: string; startIndex: number}> = [];
  
  while ((match = receiptPattern.exec(text)) !== null) {
    potentialTransactions.push({
      receipt: match[1],
      timestamp: match[2],
      startIndex: match.index
    });
  }
  
  console.log(`Found ${potentialTransactions.length} potential transactions`);
  
  // Track charge rows to skip
  const chargeReceipts = new Set<string>();
  
  // First pass: identify charge-only rows
  for (let i = 0; i < potentialTransactions.length; i++) {
    const txInfo = potentialTransactions[i];
    const nextTxInfo = potentialTransactions[i + 1];
    const endIndex = nextTxInfo ? nextTxInfo.startIndex : text.length;
    const txText = text.substring(txInfo.startIndex, endIndex).trim();
    
    // Check if this is a charge row
    if (txText.match(/(?:Charge|of Funds Charge|Pay Bill Charge|Pay Merchant Charge|Withdrawal Charge)/i)) {
      chargeReceipts.add(txInfo.receipt);
    }
  }
  
  console.log(`Identified ${chargeReceipts.size} charge rows to skip`);
  
  // Second pass: parse actual transactions
  for (let i = 0; i < potentialTransactions.length; i++) {
    const txInfo = potentialTransactions[i];
    
    // Skip charge rows
    if (chargeReceipts.has(txInfo.receipt)) {
      continue;
    }
    
    const nextTxInfo = potentialTransactions[i + 1];
    const endIndex = nextTxInfo ? nextTxInfo.startIndex : text.length;
    const txText = text.substring(txInfo.startIndex, endIndex).trim();
    
    const receiptNo = txInfo.receipt;
    const completionTime = txInfo.timestamp;
    
    // Extract status
    const statusMatch = txText.match(/\b(COMPLETED|PENDING|FAILED)\b/i);
    const status = statusMatch ? statusMatch[1].toUpperCase() : 'COMPLETED';
    
    // Extract all numbers (with commas and decimals)
    const amountMatches = txText.match(/\b(\d{1,3}(?:,\d{3})*\.?\d{0,2})\b/g);
    if (!amountMatches || amountMatches.length < 3) {
      continue;
    }
    
    // Last 3 numbers are: Paid In, Withdrawn, Balance
    const amounts = amountMatches.slice(-3);
    const paidIn = parseFloat(amounts[0].replace(/,/g, ''));
    const withdrawn = parseFloat(amounts[1].replace(/,/g, ''));
    const balance = parseFloat(amounts[2].replace(/,/g, ''));
    
    // Extract details - between timestamp and status
    let details = txText
      .substring(txText.indexOf(completionTime) + completionTime.length);
    
    // Remove status and amounts from the end
    const statusIndex = details.lastIndexOf(status);
    if (statusIndex > 0) {
      details = details.substring(0, statusIndex);
    }
    
    // Remove amounts
    amounts.forEach(amt => {
      const idx = details.lastIndexOf(amt);
      if (idx > 0) {
        details = details.substring(0, idx);
      }
    });
    
    // Clean up
    details = details
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim();
    
    // Skip if details are empty or too short
    if (details.length < 3) {
      continue;
    }
    
    transactions.push({
      receiptNo,
      completionTime,
      details,
      status,
      paidIn,
      withdrawn,
      balance
    });
  }
  
  console.log(`Parsed ${transactions.length} valid transactions`);
  if (transactions.length > 0) {
    console.log("Sample transaction:", transactions[0]);
  }
  
  return transactions;
}