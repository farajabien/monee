
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
  
  // PDF.js often extracts all text with minimal line breaks
  // We need to find individual transaction patterns in the continuous text
  // Pattern: RECEIPT_NO TIMESTAMP Details STATUS AMOUNTS
  
  // Split text by receipt numbers to get individual transactions
  // Receipt pattern: RE followed by 6-12 alphanumeric chars + timestamp
  const receiptPattern = /(RE[A-Z0-9]{6,12})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
  
  let match;
  const potentialTransactions: Array<{receipt: string; timestamp: string; startIndex: number}> = [];
  
  while ((match = receiptPattern.exec(text)) !== null) {
    potentialTransactions.push({
      receipt: match[1],
      timestamp: match[2],
      startIndex: match.index
    });
  }
  
  console.log(`Found ${potentialTransactions.length} potential transactions with receipt + timestamp`);
  
  // Process each transaction
  for (let i = 0; i < potentialTransactions.length; i++) {
    const txInfo = potentialTransactions[i];
    const nextTxInfo = potentialTransactions[i + 1];
    
    // Extract text from this transaction start to next transaction start (or end of text)
    const endIndex = nextTxInfo ? nextTxInfo.startIndex : text.length;
    const txText = text.substring(txInfo.startIndex, endIndex).trim();
    
    if (i < 3) {
      console.log(`Transaction #${i + 1}: ${txText.substring(0, 200)}`);
    }
    
    const receiptNo = txInfo.receipt;
    const completionTime = txInfo.timestamp;
    
    // Extract status
    const statusMatch = txText.match(/(COMPLETED|PENDING|FAILED)/i);
    const status = statusMatch ? statusMatch[1].toUpperCase() : 'COMPLETED';
    
    // Extract amounts - look for numbers after the status
    // Pattern: STATUS PAID_IN WITHDRAWN BALANCE
    const amountMatches = txText.match(/\b(\d{1,3}(?:,\d{3})*\.?\d{0,2})\b/g);
    if (!amountMatches || amountMatches.length < 3) {
      if (i < 3) {
        console.log(`Not enough amounts for ${receiptNo}: found ${amountMatches?.length || 0} amounts`);
      }
      continue;
    }
    
    // Last 3 numbers are: Paid In, Withdrawn, Balance
    const amounts = amountMatches.slice(-3);
    const paidIn = parseFloat(amounts[0].replace(/,/g, ''));
    const withdrawn = parseFloat(amounts[1].replace(/,/g, ''));
    const balance = parseFloat(amounts[2].replace(/,/g, ''));
    
    // Extract details (text between timestamp and status)
    let details = txText
      .replace(receiptNo, '')
      .replace(completionTime, '')
      .replace(status, '');
    
    // Remove the amounts from the end
    amounts.forEach((amt: string) => {
      details = details.replace(amt, '');
    });
    
    details = details.trim();
    
    // Clean up extra spaces and common artifacts
    details = details
      .replace(/\s+/g, ' ')
      .replace(/\s+,/g, ',')
      .replace(/,\s+/g, ', ')
      .trim();
    
    if (details.length > 0) {
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
  }
  
  console.log(`parseStatementText: Found ${potentialTransactions.length} potential, parsed ${transactions.length} valid transactions`);
  if (transactions.length > 0) {
    console.log("First parsed transaction:", transactions[0]);
  }
  
  return transactions;
}

/**
 * Convert statement transactions to M-Pesa SMS message format
 * This allows reusing the existing SMS parser
 */
export function convertStatementToMessages(transactions: StatementTransaction[]): string[] {
  return transactions.map(tx => {
    const date = new Date(tx.completionTime);
    const dateStr = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Money received
    if (tx.paidIn > 0 && tx.withdrawn === 0) {
      const senderMatch = tx.details.match(/(?:from|received from)\s+(\d+\*+\d+|\d+)\s*-?\s*(.+?)(?:\s+COMPLETED|$)/i);
      const name = senderMatch ? senderMatch[2].trim() : 'Unknown Sender';
      const phone = senderMatch ? senderMatch[1] : '';
      
      return `${tx.receiptNo} Confirmed. You have received Ksh${tx.paidIn.toFixed(2)} from ${name}${phone ? ' ' + phone : ''} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
    }
    
    // Money sent/paid
    if (tx.withdrawn > 0 && tx.paidIn === 0) {
      const lower = tx.details.toLowerCase();
      
      // Pay Bill
      if (lower.includes('pay bill')) {
        const match = tx.details.match(/pay bill to (\d+)\s*-?\s*(.+?)(?:acc\.|account|$)/i);
        const business = match ? match[2].trim() : 'Business';
        const tillNo = match ? match[1] : '';
        
        return `${tx.receiptNo} Confirmed. Ksh${tx.withdrawn.toFixed(2)} paid to ${business}${tillNo ? ' (Till: ' + tillNo + ')' : ''} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
      }
      
      // Customer Transfer / Send Money
      if (lower.includes('customer transfer') || lower.includes('send')) {
        const match = tx.details.match(/(?:to|transfer to)\s+(\d+\*+\d+|\d+)\s*-?\s*(.+?)(?:\s+COMPLETED|$)/i);
        const name = match ? match[2].trim() : 'Recipient';
        const phone = match ? match[1] : '';
        
        return `${tx.receiptNo} Confirmed. Ksh${tx.withdrawn.toFixed(2)} sent to ${name}${phone ? ' ' + phone : ''} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
      }
      
      // Merchant Payment / Buy Goods
      if (lower.includes('merchant payment') || lower.includes('buy goods')) {
        const match = tx.details.match(/(?:to|payment to)\s+\d+\s*-?\s*(.+?)(?:\s+COMPLETED|$)/i);
        const merchant = match ? match[1].trim() : 'Merchant';
        
        return `${tx.receiptNo} Confirmed. You bought goods worth Ksh${tx.withdrawn.toFixed(2)} from ${merchant} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
      }
      
      // Airtime
      if (lower.includes('airtime')) {
        return `${tx.receiptNo} Confirmed. You bought Ksh${tx.withdrawn.toFixed(2)} of airtime on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
      }
      
      // Withdraw / Cash Out
      if (lower.includes('withdraw') || lower.includes('cash out')) {
        const match = tx.details.match(/(?:from|at)\s+(.+?)(?:\s+COMPLETED|$)/i);
        const location = match ? match[1].trim() : 'Agent';
        
        return `${tx.receiptNo} Confirmed. Ksh${tx.withdrawn.toFixed(2)} withdrawn from ${location} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
      }
      
      // Generic withdrawal
      return `${tx.receiptNo} Confirmed. Ksh${tx.withdrawn.toFixed(2)} withdrawn on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${tx.balance.toFixed(2)}.`;
    }
    
    return '';
  }).filter(msg => msg.length > 0);
}

/**
 * Extract text from PDF file using browser's native capabilities
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  console.log("extractTextFromPDF: Starting extraction for file:", file.name);
  
  // For browser environment, we'll use pdfjs-dist
  // This needs to be imported dynamically to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  
  console.log("pdfjs-dist version:", pdfjsLib.version);
  
  // Try using jsdelivr CDN for the worker (more reliable than cloudflare)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  console.log("Worker source set to:", pdfjsLib.GlobalWorkerOptions.workerSrc);
  
  const arrayBuffer = await file.arrayBuffer();
  console.log("File loaded, size:", arrayBuffer.byteLength, "bytes");
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  console.log("PDF loaded successfully, pages:", pdf.numPages);
  
  let fullText = '';
  
  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    console.log(`Extracting page ${i}/${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    console.log(`Page ${i} extracted: ${pageText.length} chars`);
    fullText += pageText + '\n';
  }
  
  console.log("PDF extraction complete. Total text length:", fullText.length);
  return fullText;
}
