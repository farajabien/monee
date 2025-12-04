"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { DebtWithUser, DebtType } from "@/types";
import { calculateDebt, getDebtTypeDescription } from "@/lib/debt-calculator";

interface QuickDebtFormProps {
  onSuccess?: () => void;
  debt?: DebtWithUser;
}

export function QuickDebtForm({ onSuccess, debt }: QuickDebtFormProps) {
  const { user } = db.useAuth();

  // Fetch profile
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
    },
  });
  const profile = data?.profiles?.[0];
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [debtType, setDebtType] = useState<DebtType>("one-time");
  const [interestRate, setInterestRate] = useState<string>("0");
  const [interestCalcType, setInterestCalcType] = useState<
    "monthly" | "yearly" | "total"
  >("yearly");
  const [paymentDueDay, setPaymentDueDay] = useState<string>("1");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields when editing
  useEffect(() => {
    if (debt) {
      setName(debt.name || "");
      setTotalAmount(debt.totalAmount?.toString() || "");
      setDebtType((debt.debtType as DebtType) || "one-time");
      setInterestRate(debt.interestRate?.toString() || "0");
      setPaymentDueDay(debt.paymentDueDay?.toString() || "1");
      setMonthlyPaymentAmount(debt.monthlyPaymentAmount?.toString() || "");
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate monthly payment only for amortizing debts
    if (debtType === "amortizing" && !monthlyPaymentAmount) {
      toast.error("Please enter a monthly payment amount for amortizing loans");
      return;
    }

    setIsSubmitting(true);
    try {
      let parsedInterestRate = parseFloat(interestRate || "0");

      // Convert interest rate based on calculation type
      if (parsedInterestRate > 0) {
        if (interestCalcType === "monthly") {
          // Monthly rate to yearly: multiply by 12
          parsedInterestRate = parsedInterestRate * 12;
        } else if (interestCalcType === "total") {
          // Total interest on principal: convert to yearly rate
          // Total interest % = yearly rate, already correct
          parsedInterestRate = parsedInterestRate;
        }
        // If yearly, use as-is
      }

      const hasInterest = parsedInterestRate > 0;
      const newTotalAmount = parseFloat(totalAmount);

      // When editing, adjust currentBalance proportionally to maintain payment history
      let newCurrentBalance: number;
      if (debt) {
        // Calculate the difference in total amount
        const totalAmountDiff = newTotalAmount - debt.totalAmount;
        // Adjust current balance by the same difference
        newCurrentBalance = debt.currentBalance + totalAmountDiff;
        // Ensure current balance doesn't go negative
        newCurrentBalance = Math.max(0, newCurrentBalance);
      } else {
        // For new debts, current balance equals total amount
        newCurrentBalance = newTotalAmount;
      }

      const debtData: Record<string, unknown> = {
        name: name.trim(),
        totalAmount: newTotalAmount,
        currentBalance: newCurrentBalance,
        debtType,
        interestRate: parsedInterestRate,
        paymentDueDay: parseInt(paymentDueDay || "1"),
        monthlyPaymentAmount:
          debtType === "amortizing"
            ? parseFloat(monthlyPaymentAmount || "0")
            : 0,
        compoundingFrequency: hasInterest ? "monthly" : undefined,
        createdAt: debt?.createdAt || Date.now(),
      };

      if (debt) {
        // Update existing debt
        await db.transact(db.tx.debts[debt.id].update(debtData));
        toast.success("Debt updated successfully!");
      } else {
        // Create new debt
        await db.transact(
          db.tx.debts[id()]
            .update(debtData)
            .link({ profile: profile?.id || "" })
        );
        toast.success("Debt added successfully!");
      }

      // Reset form
      setName("");
      setTotalAmount("");
      setDebtType("one-time");
      setInterestRate("0");
      setInterestCalcType("yearly");
      setPaymentDueDay("1");
      setMonthlyPaymentAmount("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving debt:", error);
      toast.error(debt ? "Failed to update debt" : "Failed to add debt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="debt-name">Debt Name</Label>
        <Input
          id="debt-name"
          type="text"
          placeholder="e.g., Car Loan, M-Shwari"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Step 1: Amount */}
      <div className="space-y-2">
        <Label htmlFor="total-amount">Total Amount (KES)</Label>
        <Input
          id="total-amount"
          type="number"
          step="0.01"
          placeholder="100000"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
        {debt &&
          totalAmount &&
          parseFloat(totalAmount) !== debt.totalAmount && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Note: Changing the total amount will adjust the remaining balance
              proportionally
            </p>
          )}
      </div>

      {/* Step 2: Debt Type */}
      <div className="space-y-2">
        <Label htmlFor="debt-type">Debt Type</Label>
        <Select
          value={debtType}
          onValueChange={(value) => setDebtType(value as DebtType)}
        >
          <SelectTrigger id="debt-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time">One-Time</SelectItem>
            <SelectItem value="interest-push">Interest-Push</SelectItem>
            <SelectItem value="amortizing">Amortizing</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {getDebtTypeDescription(debtType)}
        </p>
      </div>

      {/* Step 3: Interest Rate (all debts) */}
      <div className="space-y-2">
        <Label htmlFor="interest-rate">Interest Rate (%)</Label>
        <div className="flex gap-2">
          <Input
            id="interest-rate"
            type="number"
            step="0.01"
            placeholder="0"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="flex-1"
          />
          <Select
            value={interestCalcType}
            onValueChange={(value) =>
              setInterestCalcType(value as "monthly" | "yearly" | "total")
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Per Month</SelectItem>
              <SelectItem value="yearly">Per Year</SelectItem>
              <SelectItem value="total">On Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">Enter 0 for no interest</p>
      </div>

      {/* Step 4: Due Day (always show) */}
      <div className="space-y-2">
        <Label htmlFor="payment-due-day">Payment Due Day (1-31)</Label>
        <Input
          id="payment-due-day"
          type="number"
          min="1"
          max="31"
          placeholder="1"
          value={paymentDueDay}
          onChange={(e) => setPaymentDueDay(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Day of the month when payment is due
        </p>
      </div>

      {/* Step 5: Monthly Payment (only for amortizing) */}
      {debtType === "amortizing" && (
        <div className="space-y-2">
          <Label htmlFor="monthly-payment">Monthly Payment Amount (KES)</Label>
          <Input
            id="monthly-payment"
            type="number"
            step="0.01"
            placeholder="5000"
            value={monthlyPaymentAmount}
            onChange={(e) => setMonthlyPaymentAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Amount you&apos;ll pay each month (principal + interest)
          </p>
        </div>
      )}

      {/* Payment Preview for amortizing */}
      {totalAmount &&
        debtType === "amortizing" &&
        monthlyPaymentAmount &&
        parseFloat(interestRate || "0") > 0 && (
          <div className="text-xs space-y-1 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
            {(() => {
              let yearlyRate = parseFloat(interestRate || "0");
              if (interestCalcType === "monthly") yearlyRate *= 12;

              const calc = calculateDebt(
                debtType,
                parseFloat(totalAmount),
                yearlyRate,
                parseFloat(monthlyPaymentAmount),
                "monthly"
              );
              return (
                <>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Payment Preview:
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">
                    Payoff Time: ~{calc.payoffMonths} months
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">
                    Total Interest: KES{" "}
                    {calc.totalInterest.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Total Payment: KES{" "}
                    {calc.totalPayment.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? debt
            ? "Updating..."
            : "Adding..."
          : debt
          ? "Update Debt"
          : "Add Debt"}
      </Button>
    </form>
  );
}
