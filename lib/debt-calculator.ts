/**
 * Debt Calculator Utility
 * Handles three types of debts:
 * 1. One-time: Simple debt with no interest
 * 2. Interest-Push: Interest accumulates but principal doesn't decrease until fully paid
 * 3. Amortizing: Standard loan where each payment reduces principal
 */

import type { DebtType, CompoundingFrequency } from "@/types";

export interface DebtCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  payoffMonths: number;
  amortizationSchedule?: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate compound interest for a given period
 * Note: Reserved for future use in advanced debt projections
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  compoundingFrequency: CompoundingFrequency,
  months: number
): number {
  const rate = annualRate / 100;
  const periodsPerYear = compoundingFrequency === "monthly" ? 12 : 
                         compoundingFrequency === "quarterly" ? 4 : 1;
  const periods = (months / 12) * periodsPerYear;
  
  return principal * Math.pow(1 + rate / periodsPerYear, periods) - principal;
}

/**
 * Calculate interest for the current month based on compounding frequency
 */
export function calculateMonthlyInterest(
  balance: number,
  annualRate: number,
  compoundingFrequency: CompoundingFrequency
): number {
  const rate = annualRate / 100;
  
  switch (compoundingFrequency) {
    case "monthly":
      return balance * (rate / 12);
    case "quarterly":
      // For quarterly, apply 1/3 of quarterly interest each month
      return balance * (rate / 4) / 3;
    case "annually":
      // For annual, apply 1/12 of annual interest each month
      return balance * rate / 12;
    default:
      return balance * (rate / 12);
  }
}

/**
 * Calculate payment schedule for ONE-TIME debts
 * Simple debt with no interest
 */
export function calculateOneTimeDebt(
  principal: number,
  monthlyPayment: number
): DebtCalculation {
  const months = Math.ceil(principal / monthlyPayment);
  
  return {
    monthlyPayment,
    totalInterest: 0,
    totalPayment: principal,
    payoffMonths: months,
  };
}

/**
 * Calculate payment schedule for INTEREST-PUSH debts
 * Interest accumulates but principal stays same until final payment
 * Each monthly payment only covers the interest
 */
export function calculateInterestPushDebt(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  compoundingFrequency: CompoundingFrequency = "monthly"
): DebtCalculation {
  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let month = 0;
  let totalInterestPaid = 0;

  // Calculate interest-only payments
  while (balance > 0 && month < 1200) { // Max 100 years
    month++;
    
    const interestForMonth = calculateMonthlyInterest(balance, annualRate, compoundingFrequency);
    
    // If payment doesn't cover interest, debt grows
    if (monthlyPayment < interestForMonth) {
      // Interest adds to principal
      balance += (interestForMonth - monthlyPayment);
      totalInterestPaid += monthlyPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: 0,
        interest: monthlyPayment,
        balance,
      });
    } else {
      // Payment covers interest, excess reduces principal
      const principalPayment = monthlyPayment - interestForMonth;
      balance -= principalPayment;
      totalInterestPaid += interestForMonth;
      
      if (balance < 0) balance = 0;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestForMonth,
        balance,
      });
    }
  }

  return {
    monthlyPayment,
    totalInterest: totalInterestPaid,
    totalPayment: principal + totalInterestPaid,
    payoffMonths: month,
    amortizationSchedule: schedule,
  };
}

/**
 * Calculate payment schedule for AMORTIZING debts
 * Standard loan where each payment reduces principal and pays interest
 */
export function calculateAmortizingDebt(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  compoundingFrequency: CompoundingFrequency = "monthly"
): DebtCalculation {
  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let month = 0;
  let totalInterestPaid = 0;

  while (balance > 0.01 && month < 1200) { // Max 100 years, small epsilon for rounding
    month++;
    
    const interestForMonth = calculateMonthlyInterest(balance, annualRate, compoundingFrequency);
    
    // If payment doesn't cover interest, debt grows
    if (monthlyPayment < interestForMonth) {
      balance += (interestForMonth - monthlyPayment);
      totalInterestPaid += monthlyPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: 0,
        interest: monthlyPayment,
        balance,
      });
    } else {
      const principalPayment = monthlyPayment - interestForMonth;
      balance -= principalPayment;
      totalInterestPaid += interestForMonth;
      
      // Handle final payment
      if (balance < 0) {
        const actualPayment = monthlyPayment + balance;
        schedule.push({
          month,
          payment: actualPayment,
          principal: principalPayment + balance,
          interest: interestForMonth,
          balance: 0,
        });
        balance = 0;
      } else {
        schedule.push({
          month,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestForMonth,
          balance,
        });
      }
    }
  }

  return {
    monthlyPayment,
    totalInterest: totalInterestPaid,
    totalPayment: principal + totalInterestPaid,
    payoffMonths: month,
    amortizationSchedule: schedule,
  };
}

/**
 * Calculate optimal monthly payment for amortizing debt given target months
 * Note: compoundingFrequency parameter reserved for future enhancements
 */
export function calculateRequiredPayment(
  principal: number,
  annualRate: number,
  targetMonths: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compoundingFrequency: CompoundingFrequency = "monthly"
): number {
  const monthlyRate = annualRate / 100 / 12;
  
  if (annualRate === 0) {
    return principal / targetMonths;
  }
  
  // Standard amortization formula
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, targetMonths)) / 
                  (Math.pow(1 + monthlyRate, targetMonths) - 1);
  
  return Math.ceil(payment * 100) / 100; // Round up to nearest cent
}

/**
 * Main debt calculator that routes to appropriate calculation based on type
 */
export function calculateDebt(
  debtType: DebtType,
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  compoundingFrequency: CompoundingFrequency = "monthly"
): DebtCalculation {
  switch (debtType) {
    case "one-time":
      return calculateOneTimeDebt(principal, monthlyPayment);
    
    case "interest-push":
      return calculateInterestPushDebt(principal, annualRate, monthlyPayment, compoundingFrequency);
    
    case "amortizing":
      return calculateAmortizingDebt(principal, annualRate, monthlyPayment, compoundingFrequency);
    
    default:
      return calculateOneTimeDebt(principal, monthlyPayment);
  }
}

/**
 * Get a human-readable description of debt type
 */
export function getDebtTypeDescription(debtType: DebtType): string {
  switch (debtType) {
    case "one-time":
      return "Simple debt with no interest. Each payment reduces the balance.";
    case "interest-push":
      return "Interest accumulates over time. Principal remains until paid in full.";
    case "amortizing":
      return "Standard loan. Each payment covers interest and reduces principal.";
    default:
      return "";
  }
}

/**
 * Suggest appropriate debt type based on characteristics
 */
export function suggestDebtType(hasInterest: boolean, isLoan: boolean): DebtType {
  if (!hasInterest) return "one-time";
  if (isLoan) return "amortizing";
  return "interest-push";
}
