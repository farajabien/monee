/**
 * Analyzer Storage - IndexedDB wrapper for offline M-Pesa transaction analysis
 * Stores transactions locally in the browser for privacy and offline access
 */

export interface AnalyzerTransaction {
  id: string;
  amount: number;
  recipient: string;
  date: number;
  category?: string;
  rawMessage: string;
  transactionType?: string;
  parsedAt: number;
}

export interface AnalyzerStats {
  totalTransactions: number;
  totalAmount: number;
  byRecipient: Record<string, { count: number; amount: number; displayName: string }>;
  byDate: Record<string, { count: number; amount: number; transactions: AnalyzerTransaction[] }>;
  byCategory: Record<string, { count: number; amount: number }>;
}

const DB_NAME = "MoneeAnalyzer";
const DB_VERSION = 1;
const STORE_NAME = "transactions";

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("date", "date", { unique: false });
        objectStore.createIndex("recipient", "recipient", { unique: false });
        objectStore.createIndex("category", "category", { unique: false });
      }
    };
  });
}

/**
 * Save transactions to IndexedDB
 */
export async function saveTransactions(
  transactions: AnalyzerTransaction[]
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  for (const tx of transactions) {
    store.put(tx);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get all transactions from IndexedDB
 */
export async function getAllTransactions(): Promise<AnalyzerTransaction[]> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(id);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Clear all transactions
 */
export async function clearAllTransactions(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Normalize recipient name for grouping
 */
function normalizeRecipient(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b0?\d{9,10}\b/g, "")
    .trim();
}

/**
 * Calculate statistics from transactions
 */
export function calculateStats(
  transactions: AnalyzerTransaction[]
): AnalyzerStats {
  const stats: AnalyzerStats = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    byRecipient: {},
    byDate: {},
    byCategory: {},
  };

  transactions.forEach((tx) => {
    // Total amount
    stats.totalAmount += tx.amount;

    // By recipient (normalized)
    if (tx.recipient) {
      const normalized = normalizeRecipient(tx.recipient);
      if (normalized) {
        if (!stats.byRecipient[normalized]) {
          stats.byRecipient[normalized] = {
            count: 0,
            amount: 0,
            displayName: tx.recipient,
          };
        }
        stats.byRecipient[normalized].count++;
        stats.byRecipient[normalized].amount += tx.amount;
      }
    }

    // By date
    const dateKey = new Date(tx.date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!stats.byDate[dateKey]) {
      stats.byDate[dateKey] = {
        count: 0,
        amount: 0,
        transactions: [],
      };
    }
    stats.byDate[dateKey].count++;
    stats.byDate[dateKey].amount += tx.amount;
    stats.byDate[dateKey].transactions.push(tx);

    // By category
    const category = tx.category || "Uncategorized";
    if (!stats.byCategory[category]) {
      stats.byCategory[category] = { count: 0, amount: 0 };
    }
    stats.byCategory[category].count++;
    stats.byCategory[category].amount += tx.amount;
  });

  return stats;
}

/**
 * Export transactions to JSON
 */
export function exportToJSON(transactions: AnalyzerTransaction[]): string {
  return JSON.stringify(transactions, null, 2);
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(transactions: AnalyzerTransaction[]): string {
  const headers = ["Date", "Amount", "Recipient", "Category", "Type", "Raw Message"];
  const rows = transactions.map((tx) => [
    new Date(tx.date).toLocaleString("en-KE"),
    tx.amount.toString(),
    tx.recipient || "",
    tx.category || "Uncategorized",
    tx.transactionType || "",
    `"${tx.rawMessage.replace(/"/g, '""')}"`,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
