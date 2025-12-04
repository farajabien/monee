/**
 * Dashboard Color Utilities
 * Centralized color logic for dashboard components
 * Only applies RED, GREEN, or YELLOW to numeric values based on their meaning
 */

// Color constants for numeric values
export const COLORS = {
  POSITIVE: "text-green-600 dark:text-green-400",
  NEGATIVE: "text-red-600 dark:text-red-400",
  WARNING: "text-yellow-600 dark:text-yellow-400",
  NEUTRAL: "", // Uses default foreground
} as const;

// Health status type from calculator
export type HealthStatus = "healthy" | "caution" | "critical";

/**
 * Get color class for balance/cash flow based on health status
 * Healthy = Green, Caution = Yellow, Critical = Red
 */
export function getBalanceColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return COLORS.POSITIVE;
    case "caution":
      return COLORS.WARNING;
    case "critical":
      return COLORS.NEGATIVE;
    default:
      return COLORS.NEUTRAL;
  }
}

/**
 * Get color class for savings/progress based on percentage
 * >75% = Green, 50-75% = Yellow, <50% = Red
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return COLORS.POSITIVE;
  if (percentage >= 50) return COLORS.WARNING;
  return COLORS.NEGATIVE;
}

/**
 * Get color for income (always positive/green)
 */
export function getIncomeColor(): string {
  return COLORS.POSITIVE;
}

/**
 * Get color for expenses/debts (always negative/red)
 */
export function getExpenseColor(): string {
  return COLORS.NEGATIVE;
}

/**
 * Get color for positive/negative change indicators
 * Positive change = Green, Negative change = Red
 */
export function getChangeColor(isPositive: boolean): string {
  return isPositive ? COLORS.POSITIVE : COLORS.NEGATIVE;
}
