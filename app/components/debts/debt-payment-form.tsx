"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DebtWithUser } from "@/types";

interface DebtPaymentFormProps {
  debt: DebtWithUser;
  onSuccess?: () => void;
}

export function DebtPaymentForm({ debt, onSuccess }: DebtPaymentFormProps) {
  const [amount, setAmount] = useState<string>(
    debt.monthlyPaymentAmount.toString()
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    try {
      const paymentAmount = parseFloat(amount);
      const paymentTimestamp = new Date(paymentDate).getTime();

      // Create payment record
      await db.transact(
        db.tx.debt_payments[id()]
          .update({
            amount: paymentAmount,
            paymentDate: paymentTimestamp,
            createdAt: Date.now(),
          })
          .link({ debt: debt.id })
      );

      // Update debt balance
      const newBalance = Math.max(0, debt.currentBalance - paymentAmount);
      await db.transact(
        db.tx.debts[debt.id].update({
          currentBalance: newBalance,
        })
      );

      // Reset form
      setAmount(debt.monthlyPaymentAmount.toString());
      setPaymentDate(new Date().toISOString().split("T")[0]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="payment-amount">Payment Amount (Ksh)</Label>
        <Input
          id="payment-amount"
          type="number"
          placeholder={debt.monthlyPaymentAmount.toString()}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-date">Payment Date</Label>
        <Input
          id="payment-date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !amount}
        className="w-full"
      >
        {isSubmitting ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
}
