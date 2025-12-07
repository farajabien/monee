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
import type { DebtWithUser } from "@/types";
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
  const [debtor, setDebtor] = useState("");
  const [debtTaken, setDebtTaken] = useState<string>("");
  const [repaymentTerms, setRepaymentTerms] = useState<string>("One-time");
  const [interestRate, setInterestRate] = useState<string>("0");
  const [interestFrequency, setInterestFrequency] =
    useState<string>("per year");
  const [paymentDueDate, setPaymentDueDate] = useState<string>("");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields when editing
  useEffect(() => {
    if (debt) {
      setDebtor(debt.debtor || "");
      setDebtTaken(debt.debtTaken?.toString() || "");
      setRepaymentTerms(debt.repaymentTerms || "One-time");
      setInterestRate(debt.interestRate?.toString() || "0");
      setInterestFrequency(debt.interestFrequency || "per year");

      // Convert paymentDueDay to a date string for the date input
      if (debt.paymentDueDay) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(debt.paymentDueDay).padStart(2, "0");
        setPaymentDueDate(`${year}-${month}-${day}`);
      }

      setMonthlyPaymentAmount(debt.monthlyPaymentAmount?.toString() || "");
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtor.trim() || !debtTaken) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!paymentDueDate) {
      toast.error("Please select a payment due date");
      return;
    }

    // Validate monthly payment only for amortizing debts
    if (repaymentTerms === "Amortizing" && !monthlyPaymentAmount) {
      toast.error("Please enter a monthly payment amount for amortizing loans");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedInterestRate = parseFloat(interestRate || "0");
      const newDebtTaken = parseFloat(debtTaken);

      // Extract day from the selected date
      const selectedDate = new Date(paymentDueDate);
      const dueDayOfMonth = selectedDate.getDate();

      // When editing, adjust currentBalance proportionally to maintain payment history
      let newCurrentBalance: number;
      if (debt) {
        // Calculate the difference in debt taken
        const debtTakenDiff = newDebtTaken - (debt.debtTaken || 0);
        // Adjust current balance by the same difference
        newCurrentBalance = debt.currentBalance + debtTakenDiff;
        // Ensure current balance doesn't go negative
        newCurrentBalance = Math.max(0, newCurrentBalance);
      } else {
        // For new debts, current balance equals debt taken
        newCurrentBalance = newDebtTaken;
      }

      const debtData: Record<string, unknown> = {
        debtor: debtor.trim(),
        debtTaken: newDebtTaken,
        currentBalance: newCurrentBalance,
        repaymentTerms,
        interestRate: parsedInterestRate,
        interestFrequency: parsedInterestRate > 0 ? interestFrequency : "N/A",
        paymentDueDay: dueDayOfMonth,
        monthlyPaymentAmount:
          repaymentTerms === "Amortizing"
            ? parseFloat(monthlyPaymentAmount || "0")
            : undefined,
        compoundingFrequency: parsedInterestRate > 0 ? "monthly" : undefined,
        isActive: true,
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
      setDebtor("");
      setDebtTaken("");
      setRepaymentTerms("One-time");
      setInterestRate("0");
      setInterestFrequency("per year");
      setPaymentDueDate("");
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
        <Label htmlFor="debtor">Debtor Name</Label>
        <Input
          id="debtor"
          type="text"
          placeholder="e.g., Bank, Friend, M-Shwari"
          value={debtor}
          onChange={(e) => setDebtor(e.target.value)}
          autoFocus
        />
      </div>

      {/* Step 1: Amount */}
      <div className="space-y-2">
        <Label htmlFor="debt-taken">Debt Amount (KES)</Label>
        <Input
          id="debt-taken"
          type="number"
          step="0.01"
          placeholder="100000"
          value={debtTaken}
          onChange={(e) => setDebtTaken(e.target.value)}
        />
        {debt && debtTaken && parseFloat(debtTaken) !== debt.debtTaken && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Note: Changing the debt amount will adjust the remaining balance
            proportionally
          </p>
        )}
      </div>

      {/* Step 2: Repayment Terms */}
      <div className="space-y-2">
        <Label htmlFor="repayment-terms">Repayment Terms</Label>
        <Select
          value={repaymentTerms}
          onValueChange={(value) => setRepaymentTerms(value)}
        >
          <SelectTrigger id="repayment-terms">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="One-time">One-time</SelectItem>
            <SelectItem value="Interest Push">Interest Push</SelectItem>
            <SelectItem value="Amortizing">Amortizing</SelectItem>
            <SelectItem value="No Interest">No Interest</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {repaymentTerms === "One-time" && "Pay back the full amount at once"}
          {repaymentTerms === "Interest Push" &&
            "Pay interest periodically, principal at end"}
          {repaymentTerms === "Amortizing" &&
            "Fixed monthly payments (principal + interest)"}
          {repaymentTerms === "No Interest" &&
            "No interest charged on this debt"}
        </p>
      </div>

      {/* Step 3: Interest Rate (if not "No Interest") */}
      {repaymentTerms !== "No Interest" && (
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
              value={interestFrequency}
              onValueChange={(value) => setInterestFrequency(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per month">Per Month</SelectItem>
                <SelectItem value="per year">Per Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter 0 for no interest
          </p>
        </div>
      )}

      {/* Step 4: Due Date (always show) */}
      <div className="space-y-2">
        <Label htmlFor="payment-due-date">Payment Due Date</Label>
        <Input
          id="payment-due-date"
          type="date"
          value={paymentDueDate}
          onChange={(e) => setPaymentDueDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Select the date when payment is due
        </p>
      </div>

      {/* Step 5: Monthly Payment (only for amortizing) */}
      {repaymentTerms === "Amortizing" && (
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
      {debtTaken &&
        repaymentTerms === "Amortizing" &&
        monthlyPaymentAmount &&
        parseFloat(interestRate || "0") > 0 && (
          <div className="text-xs space-y-1 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
            {(() => {
              let yearlyRate = parseFloat(interestRate || "0");
              if (interestFrequency === "per month") yearlyRate *= 12;

              const calc = calculateDebt(
                "amortizing",
                parseFloat(debtTaken),
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
