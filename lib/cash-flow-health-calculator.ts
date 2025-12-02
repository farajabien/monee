/**
 * Cash Flow Health Calculator
 *
 * Calculates the user's current financial health based on income vs expenses
 * for the current month. Focuses on "living in the present" with daily spending allowance.
 */

import type { Expense, IncomeSource } from "@/types";

export interface CashFlowHealthData {
  totalIncome: number;              // Total income for current month
  totalExpenses: number;            // Total expenses for current month
  remainingBalance: number;         // Income - Expenses
  dailyAllowance: number;           // Remaining balance / 30 days
  healthStatus: 'healthy' | 'caution' | 'critical';  // Overall health
  disciplineIndicator: 'up' | 'down' | 'neutral';    // vs last month
  statusEmoji: string;              // Visual indicator
  statusColor: 'success' | 'warning' | 'danger';     // Color coding
  percentageSpent: number;          // (Expenses / Income) * 100
  daysElapsed: number;              // Days passed in current month
  averageDailySpend: number;        // Total spent / days elapsed
}

interface CashFlowHealthInput {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  currentDate?: Date;
}

/**
 * Calculate total income for the current month
 */
function calculateMonthlyIncome(
  incomeSources: IncomeSource[],
  currentDate: Date
): number {
  const currentMonth = currentDate.getMonth() + 1;

  return incomeSources
    .filter(source => source.isActive)
    .filter(source => {
      // If paydayMonth is specified, only include if it matches current month
      if (source.paydayMonth && source.paydayMonth !== currentMonth) {
        return false;
      }
      return true;
    })
    .reduce((sum, source) => sum + source.amount, 0);
}

/**
 * Get discipline indicator by comparing to previous month
 */
function getDisciplineIndicator(
  currentBalance: number,
  currentIncome: number,
  previousExpenses: Expense[],
  previousIncome: number
): 'up' | 'down' | 'neutral' {
  if (previousExpenses.length === 0 || previousIncome === 0) {
    return 'neutral';
  }

  const currentSpentPercentage = currentIncome > 0
    ? ((currentIncome - currentBalance) / currentIncome) * 100
    : 0;

  const previousTotalExpenses = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousSpentPercentage = previousIncome > 0
    ? (previousTotalExpenses / previousIncome) * 100
    : 0;

  if (previousSpentPercentage === 0) return 'neutral';

  const difference = currentSpentPercentage - previousSpentPercentage;

  // Up (good) = spending less percentage than before (negative difference)
  // Down (bad) = spending more percentage than before (positive difference)
  if (difference < -5) return 'up';    // Spending 5%+ less of income = discipline up
  if (difference > 5) return 'down';   // Spending 5%+ more of income = discipline down
  return 'neutral';
}

/**
 * Determine health status based on remaining balance and spending rate
 */
function getHealthStatus(
  remainingBalance: number,
  totalIncome: number,
  percentageSpent: number
): 'healthy' | 'caution' | 'critical' {
  if (remainingBalance < 0) {
    return 'critical';  // Overspent
  }

  if (percentageSpent >= 90) {
    return 'critical';  // Spent 90%+ of income
  }

  if (percentageSpent >= 70) {
    return 'caution';   // Spent 70-90% of income
  }

  return 'healthy';     // Spent less than 70% of income
}

/**
 * Main function: Calculate cash flow health
 */
export function calculateCashFlowHealth(input: CashFlowHealthInput): CashFlowHealthData {
  const {
    incomeSources,
    expenses,
    currentDate = new Date(),
  } = input;

  // Get month boundaries
  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  // Calculate days elapsed in current month
  const daysElapsed = Math.ceil(
    (currentDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Filter expenses for current month
  const monthStartTs = monthStart.getTime();
  const monthEndTs = monthEnd.getTime();

  const currentMonthExpenses = expenses.filter(
    (e) => e.date >= monthStartTs && e.date <= monthEndTs
  );

  // Calculate totals
  const totalIncome = calculateMonthlyIncome(incomeSources, currentDate);
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = totalIncome - totalExpenses;

  // Calculate daily allowance (fixed 30 days as per user requirement)
  const dailyAllowance = remainingBalance / 30;

  // Calculate average daily spend (based on actual days elapsed)
  const averageDailySpend = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;

  // Calculate percentage spent
  const percentageSpent = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Get previous month's data for discipline indicator
  const prevMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );
  const prevMonthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0,
    23,
    59,
    59
  );

  const previousMonthExpenses = expenses.filter(
    (e) =>
      e.date >= prevMonthStart.getTime() &&
      e.date <= prevMonthEnd.getTime()
  );

  // Calculate previous month's income
  const previousIncome = calculateMonthlyIncome(
    incomeSources,
    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15)
  );

  const disciplineIndicator = getDisciplineIndicator(
    remainingBalance,
    totalIncome,
    previousMonthExpenses,
    previousIncome
  );

  // Determine health status
  const healthStatus = getHealthStatus(remainingBalance, totalIncome, percentageSpent);

  // Set emoji and color based on health status
  let statusEmoji: string;
  let statusColor: 'success' | 'warning' | 'danger';

  switch (healthStatus) {
    case 'healthy':
      statusEmoji = '✅';
      statusColor = 'success';
      break;
    case 'caution':
      statusEmoji = '⚠️';
      statusColor = 'warning';
      break;
    case 'critical':
      statusEmoji = '🚨';
      statusColor = 'danger';
      break;
  }

  return {
    totalIncome,
    totalExpenses,
    remainingBalance,
    dailyAllowance,
    healthStatus,
    disciplineIndicator,
    statusEmoji,
    statusColor,
    percentageSpent,
    daysElapsed,
    averageDailySpend,
  };
}

/**
 * Get a friendly message based on cash flow health
 */
export function getCashFlowHealthMessage(data: CashFlowHealthData): string {
  if (data.healthStatus === 'critical') {
    if (data.remainingBalance < 0) {
      return `You've overspent by ${Math.abs(data.remainingBalance).toFixed(2)}. Time to review your expenses!`;
    }
    return `You've spent ${data.percentageSpent.toFixed(0)}% of your income. Watch your spending!`;
  }

  if (data.healthStatus === 'caution') {
    return `You've used ${data.percentageSpent.toFixed(0)}% of your income. Spend carefully for the rest of the month.`;
  }

  // Healthy status
  const remainingDays = 30 - data.daysElapsed;
  return `Great job! You have ${data.remainingBalance.toFixed(0)} left with ${remainingDays} days to go.`;
}

/**
 * Get discipline message
 */
export function getDisciplineMessage(indicator: 'up' | 'down' | 'neutral'): string {
  switch (indicator) {
    case 'up':
      return '↑ Better than last month!';
    case 'down':
      return '↓ Spending more than last month';
    case 'neutral':
      return '→ Similar to last month';
  }
}

/**
 * Get daily allowance message
 */
export function getDailyAllowanceMessage(dailyAllowance: number): string {
  if (dailyAllowance <= 0) {
    return "No daily allowance available. You've spent your budget.";
  }

  if (dailyAllowance < 100) {
    return `Spend carefully: ~${dailyAllowance.toFixed(0)} per day available.`;
  }

  return `You can spend ~${dailyAllowance.toFixed(0)} per day for the rest of the month.`;
}
