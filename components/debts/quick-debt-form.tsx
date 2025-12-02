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
import type { DebtWithUser, DebtType, CompoundingFrequency } from "@/types";
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
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [paymentDueDay, setPaymentDueDay] = useState<string>("1");
  const [deadline, setDeadline] = useState<string>("");
  const [debtType, setDebtType] = useState<DebtType>("one-time");
  const [interestRate, setInterestRate] = useState<string>("");
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields when editing
  useEffect(() => {
    if (debt) {
      setName(debt.name || "");
      setTotalAmount(debt.totalAmount?.toString() || "");
      setMonthlyPaymentAmount(debt.monthlyPaymentAmount?.toString() || "");
      setPaymentDueDay(debt.paymentDueDay?.toString() || "1");
      setDeadline(debt.deadline ? new Date(debt.deadline).toISOString().split('T')[0] : "");
      setDebtType((debt.debtType as DebtType) || "one-time");
      setInterestRate(debt.interestRate?.toString() || "");
      setCompoundingFrequency((debt.compoundingFrequency as CompoundingFrequency) || "monthly");
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate monthly payment for non-one-time debts
    if (debtType !== "one-time" && !monthlyPaymentAmount) {
      toast.error("Please enter a monthly payment amount");
      return;
    }
    
    if (debtType !== "one-time" && !interestRate) {
      toast.error("Please enter an interest rate for this debt type");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedInterestRate = interestRate ? parseFloat(interestRate) : 0;
      const debtData: Record<string, unknown> = {
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        currentBalance: debt ? debt.currentBalance : parseFloat(totalAmount),
        monthlyPaymentAmount: debtType === "one-time" ? 0 : parseFloat(monthlyPaymentAmount || "0"),
        paymentDueDay: debtType === "one-time" ? 0 : parseInt(paymentDueDay || "1"),
        debtType,
        interestRate: parsedInterestRate,
        compoundingFrequency: debtType === "one-time" ? undefined : compoundingFrequency,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        createdAt: debt?.createdAt || Date.now(),
      };

      if (debt) {
        // Update existing debt
        await db.transact(db.tx.debts[debt.id].update(debtData));
        toast.success("Debt updated successfully!");
      } else {
        // Create new debt
        await db.transact(
          db.tx.debts[id()].update(debtData).link({ profile: profile?.id || "" })
        );
        toast.success("Debt added successfully!");
      }

      // Reset form
      setName("");
      setTotalAmount("");
      setMonthlyPaymentAmount("");
      setPaymentDueDay("1");
      setDeadline("");
      setDebtType("one-time");
      setInterestRate("");
      setCompoundingFrequency("monthly");

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-type">Debt Type</Label>
        <Select value={debtType} onValueChange={(value) => setDebtType(value as DebtType)}>
          <SelectTrigger id="debt-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time">One-Time (No Interest)</SelectItem>
            <SelectItem value="interest-push">Interest-Push (Interest accumulates)</SelectItem>
            <SelectItem value="amortizing">Amortizing (Standard Loan)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {getDebtTypeDescription(debtType)}
        </p>
      </div>

      {/* Monthly Payment - Only for recurring debts */}
      {debtType !== "one-time" && (
        <div className="space-y-2">
          <Label htmlFor="monthly-payment">Monthly Payment (KES)</Label>
          <Input
            id="monthly-payment"
            type="number"
            step="0.01"
            placeholder="5000"
            value={monthlyPaymentAmount}
            onChange={(e) => setMonthlyPaymentAmount(e.target.value)}
          />
        </div>
      )}

      {/* Payment Due Day - Only for recurring debts */}
      {debtType !== "one-time" && (
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
      )}

      {/* Deadline - For one-time debts and interest-push next payment */}
      {(debtType === "one-time" || debtType === "interest-push") && (
        <div className="space-y-2">
          <Label htmlFor="deadline">
            {debtType === "one-time" ? "Payment Deadline" : "Next Payment Date"}
          </Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {debtType === "one-time" 
              ? "When do you need to pay this debt in full?"
              : "When is your next interest payment due?"}
          </p>
        </div>
      )}

      {debtType !== "one-time" && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
            <Input
              id="interest-rate"
              type="number"
              step="0.01"
              placeholder="12.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compounding">Compounding Frequency</Label>
            <Select value={compoundingFrequency} onValueChange={(value) => setCompoundingFrequency(value as CompoundingFrequency)}>
              <SelectTrigger id="compounding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Payment Preview - Only for debts with monthly payments */}
      {totalAmount && debtType !== "one-time" && monthlyPaymentAmount && (
        <div className="text-xs space-y-1 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
          {(() => {
            const calc = calculateDebt(
              debtType,
              parseFloat(totalAmount),
              interestRate ? parseFloat(interestRate) : 0,
              parseFloat(monthlyPaymentAmount),
              compoundingFrequency
            );
            return (
              <>
                <div className="font-medium text-blue-900 dark:text-blue-100">Payment Preview:</div>
                <div className="text-blue-800 dark:text-blue-200">Payoff Time: ~{calc.payoffMonths} months</div>
                <div className="text-blue-800 dark:text-blue-200">Total Interest: KES {calc.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="font-medium text-blue-900 dark:text-blue-100">Total Payment: KES {calc.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </>
            );
          })()}
        </div>
      )}

      {/* One-time debt summary */}
      {totalAmount && debtType === "one-time" && (
        <div className="text-xs space-y-1 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
          <div className="font-medium text-blue-900 dark:text-blue-100">One-Time Payment:</div>
          <div className="text-blue-800 dark:text-blue-200">Amount Due: KES {parseFloat(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          {deadline && (
            <div className="text-blue-800 dark:text-blue-200">
              Due Date: {new Date(deadline).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
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
