import type { SavedAnalysis, YearStats } from "@/types/year-analysis";

const STORAGE_KEY = "monee_saved_analyses";
const MAX_SAVED = 10; // Limit to 10 saved analyses

/**
 * Save a year analysis to browser localStorage
 */
export function saveAnalysis(
  yearStats: YearStats,
  inputMethod: "pdf" | "statement" | "sms",
  fileName?: string
): SavedAnalysis {
  const savedAnalysis: SavedAnalysis = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    dateRange: {
      start: yearStats.firstExpense,
      end: yearStats.lastExpense,
    },
    yearStats,
    inputMethod,
    fileName,
  };

  try {
    // Get existing analyses
    const existing = loadAnalyses();

    // Add new analysis at the beginning
    const updated = [savedAnalysis, ...existing];

    // Keep only MAX_SAVED most recent
    const trimmed = updated.slice(0, MAX_SAVED);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    return savedAnalysis;
  } catch (error) {
    console.error("Failed to save analysis:", error);
    throw new Error("Failed to save analysis. Storage might be full.");
  }
}

/**
 * Load all saved analyses from localStorage
 */
export function loadAnalyses(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Convert date strings back to Date objects
    return parsed.map((analysis: any) => ({
      ...analysis,
      dateRange: {
        start: new Date(analysis.dateRange.start),
        end: new Date(analysis.dateRange.end),
      },
      yearStats: {
        ...analysis.yearStats,
        firstExpense: new Date(analysis.yearStats.firstExpense),
        lastExpense: new Date(analysis.yearStats.lastExpense),
      },
    }));
  } catch (error) {
    console.error("Failed to load analyses:", error);
    return [];
  }
}

/**
 * Delete a specific analysis by ID
 */
export function deleteAnalysis(id: string): void {
  try {
    const existing = loadAnalyses();
    const filtered = existing.filter((analysis) => analysis.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete analysis:", error);
    throw new Error("Failed to delete analysis");
  }
}

/**
 * Clear all saved analyses
 */
export function clearAllAnalyses(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear analyses:", error);
    throw new Error("Failed to clear analyses");
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  count: number;
  canSaveMore: boolean;
} {
  const analyses = loadAnalyses();
  return {
    count: analyses.length,
    canSaveMore: analyses.length < MAX_SAVED,
  };
}
