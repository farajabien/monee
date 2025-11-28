/**
 * Cash Runway Calculator
 *
 * Calculates how long the user's current cash will last until their next payday,
 * based on their spending patterns this month.
 */

import type { Expense, IncomeSource } from "@/types";

export interface CashRunwayData {
  currentCash: number;              // Income this month - Expenses so far
  daysToPayday: number;             // Days until next income
  dailyAverageSpend: number;        // Total spent / days elapsed this month
  projectedBalance: number;         // currentCash - (dailyAvg * daysToPayday)
  willMakeIt: boolean;              // projectedBalance > 0
  disciplineIndicator: 'up' | 'down' | 'neutral';  // Compare to last period
  statusEmoji: string;              // Visual status indicator
  statusColor: 'success' | 'warning' | 'danger';  // Color coding
  nextPaydayDate: Date | null;      // When is the next payday
  projectedDailyBudget: number;     // How much user can spend daily to make it
}

interface CashRunwayInput {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  debtPayments?: Array<{ amount: number; paymentDate: number }>;
  currentDate?: Date;
}

/**
 * Get the next payday date based on income sources
 */
function getNextPaydayDate(
  incomeSources: IncomeSource[],
  currentDate: Date
): Date | null {
  if (!incomeSources.length) return null;

  const today = currentDate;
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Find the nearest payday
  let nearestPayday: Date | null = null;
  let minDaysDiff = Infinity;

  incomeSources.forEach((source) => {
    if (!source.isActive || !source.paydayDay) return;

    const paydayThisMonth = new Date(currentYear, currentMonth, source.paydayDay);
    const paydayNextMonth = new Date(currentYear, currentMonth + 1, source.paydayDay);

    // Check this month's payday
    if (paydayThisMonth > today) {
      const daysDiff = Math.ceil((paydayThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < minDaysDiff) {
        minDaysDiff = daysDiff;
        nearestPayday = paydayThisMonth;
      }
    }

    // Check next month's payday
    const daysDiffNextMonth = Math.ceil((paydayNextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiffNextMonth < minDaysDiff) {
      minDaysDiff = daysDiffNextMonth;
      nearestPayday = paydayNextMonth;
    }
  });

  return nearestPayday;
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
      // If paydayMonth is specified, only include if it matches
      if (source.paydayMonth && source.paydayMonth !== currentMonth) {
        return false;
      }
      return true;
    })
    .reduce((sum, source) => sum + source.amount, 0);
}

/**
 * Calculate daily average spending
 */
function calculateDailyAverage(
  expenses: Expense[],
  debtPayments: Array<{ amount: number; paymentDate: number }> = [],
  monthStart: Date,
  currentDate: Date
): number {
  const daysElapsed = Math.ceil(
    (currentDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysElapsed === 0) return 0;

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalDebtPayments = debtPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (totalExpenses + totalDebtPayments) / daysElapsed;
}

/**
 * Get discipline indicator by comparing current daily average to previous period
 */
function getDisciplineIndicator(
  currentDailyAvg: number,
  previousExpenses: Expense[],
  previousPeriodDays: number
): 'up' | 'down' | 'neutral' {
  if (previousExpenses.length === 0 || previousPeriodDays === 0) {
    return 'neutral';
  }

  const previousDailyAvg =
    previousExpenses.reduce((sum, e) => sum + e.amount, 0) / previousPeriodDays;

  if (previousDailyAvg === 0) return 'neutral';

  const difference = ((currentDailyAvg - previousDailyAvg) / previousDailyAvg) * 100;

  // Up (good) = spending less than before (negative difference)
  // Down (bad) = spending more than before (positive difference)
  if (difference < -5) return 'up';  // Spending 5%+ less = discipline up
  if (difference > 5) return 'down';  // Spending 5%+ more = discipline down
  return 'neutral';
}

/**
 * Main function: Calculate cash runway data
 */
export function calculateCashRunway(input: CashRunwayInput): CashRunwayData {
  const {
    incomeSources,
    expenses,
    debtPayments = [],
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

  // Filter expenses and debt payments for current month
  const monthStartTs = monthStart.getTime();
  const monthEndTs = monthEnd.getTime();

  const currentMonthExpenses = expenses.filter(
    (e) => e.date >= monthStartTs && e.date <= monthEndTs
  );

  const currentMonthDebtPayments = debtPayments.filter(
    (p) => p.paymentDate >= monthStartTs && p.paymentDate <= monthEndTs
  );

  // Calculate totals
  const totalIncome = calculateMonthlyIncome(incomeSources, currentDate);
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebtPayments = currentMonthDebtPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentCash = totalIncome - totalExpenses - totalDebtPayments;

  // Get next payday
  const nextPaydayDate = getNextPaydayDate(incomeSources, currentDate);
  const daysToPayday = nextPaydayDate
    ? Math.ceil((nextPaydayDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 30; // Default to 30 days if no payday set

  // Calculate daily average
  const dailyAverageSpend = calculateDailyAverage(
    currentMonthExpenses,
    currentMonthDebtPayments,
    monthStart,
    currentDate
  );

  // Project balance
  const projectedBalance = currentCash - dailyAverageSpend * daysToPayday;
  const willMakeIt = projectedBalance >= 0;

  // Calculate projected daily budget (how much can be spent daily to make it)
  const projectedDailyBudget = daysToPayday > 0 ? currentCash / daysToPayday : 0;

  // Get previous month's expenses for discipline indicator
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

  const previousPeriodDays = Math.ceil(
    (prevMonthEnd.getTime() - prevMonthStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const disciplineIndicator = getDisciplineIndicator(
    dailyAverageSpend,
    previousMonthExpenses,
    previousPeriodDays
  );

  // Determine status
  let statusEmoji: string;
  let statusColor: 'success' | 'warning' | 'danger';

  if (projectedBalance >= 0) {
    if (projectedBalance > dailyAverageSpend * 5) {
      // More than 5 days buffer
      statusEmoji = '✅';
      statusColor = 'success';
    } else {
      // Cutting it close
      statusEmoji = '⚠️';
      statusColor = 'warning';
    }
  } else {
    // Will run out before payday
    statusEmoji = '🚨';
    statusColor = 'danger';
  }

  return {
    currentCash,
    daysToPayday,
    dailyAverageSpend,
    projectedBalance,
    willMakeIt,
    disciplineIndicator,
    statusEmoji,
    statusColor,
    nextPaydayDate,
    projectedDailyBudget,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get a friendly message based on cash runway status
 */
export function getCashRunwayMessage(data: CashRunwayData): string {
  if (data.daysToPayday === 0) {
    return "Payday is today!";
  }

  if (data.willMakeIt) {
    if (data.projectedBalance > data.dailyAverageSpend * 5) {
      return `You're on track! ${data.daysToPayday} days to payday.`;
    } else {
      return `Cutting it close, but you'll make it! ${data.daysToPayday} days left.`;
    }
  } else {
    const daysShort = Math.ceil(
      Math.abs(data.projectedBalance) / data.dailyAverageSpend
    );
    return `Warning: You'll run out ${daysShort} day${daysShort !== 1 ? 's' : ''} before payday!`;
  }
}

/**
 * Get discipline message
 */
export function getDisciplineMessage(indicator: 'up' | 'down' | 'neutral'): string {
  switch (indicator) {
    case 'up':
      return '↑ Spending less than last month!';
    case 'down':
      return '↓ Spending more than last month';
    case 'neutral':
      return '→ Similar to last month';
  }
}
