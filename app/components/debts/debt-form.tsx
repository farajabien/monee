"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Debt } from "@/types";

interface DebtFormProps {
  debt?: Debt | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DebtForm({ debt, onSuccess, onCancel }: DebtFormProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<string>("");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [paymentDueDay, setPaymentDueDay] = useState<number>(1);
  const [interestRate, setInterestRate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setTotalAmount(debt.totalAmount.toString());
      setCurrentBalance(debt.currentBalance.toString());
      setMonthlyPaymentAmount(debt.monthlyPaymentAmount.toString());
      setPaymentDueDay(debt.paymentDueDay);
      setInterestRate(debt.interestRate?.toString() || "");
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount || !currentBalance || !monthlyPaymentAmount) return;

    setIsSubmitting(true);
    try {
      const debtData = {
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        currentBalance: parseFloat(currentBalance),
        monthlyPaymentAmount: parseFloat(monthlyPaymentAmount),
        paymentDueDay,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        createdAt: debt?.createdAt || Date.now(),
      };

      if (debt) {
        // Update existing debt
        await db.transact(db.tx.debts[debt.id].update(debtData));
      } else {
        // Create new debt
        await db.transact(
          db.tx.debts[id()].update(debtData).link({ user: user.id })
        );
      }

      // Reset form
      setName("");
      setTotalAmount("");
      setCurrentBalance("");
      setMonthlyPaymentAmount("");
      setPaymentDueDay(1);
      setInterestRate("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving debt:", error);
      alert("Failed to save debt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="debt-name">Debt Name</Label>
        <Input
          id="debt-name"
          type="text"
          placeholder="e.g., Bank Loan, Credit Card, Friend"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total-amount">Total Amount (Ksh)</Label>
          <Input
            id="total-amount"
            type="number"
            placeholder="100000"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-balance">Current Balance (Ksh)</Label>
          <Input
            id="current-balance"
            type="number"
            placeholder="75000"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly-payment">Monthly Payment (Ksh)</Label>
          <Input
            id="monthly-payment"
            type="number"
            placeholder="5000"
            value={monthlyPaymentAmount}
            onChange={(e) => setMonthlyPaymentAmount(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-due-day">Payment Due Day (1-31)</Label>
          <Input
            id="payment-due-day"
            type="number"
            min="1"
            max="31"
            value={paymentDueDay}
            onChange={(e) => setPaymentDueDay(parseInt(e.target.value, 10) || 1)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interest-rate">Interest Rate % (Optional)</Label>
        <Input
          id="interest-rate"
          type="number"
          placeholder="12.5"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          min="0"
          step="0.1"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !name.trim() ||
            !totalAmount ||
            !currentBalance ||
            !monthlyPaymentAmount
          }
        >
          {isSubmitting ? "Saving..." : debt ? "Update Debt" : "Add Debt"}
        </Button>
      </div>
    </form>
  );
}

