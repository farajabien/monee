"use client";

import { useState, useEffect } from "react";
import React from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DebtWithUser } from "@/types";

interface DebtPaymentFormProps {
  debt: DebtWithUser;
  onSuccess?: () => void;
}

export function DebtPaymentForm({ debt, onSuccess }: DebtPaymentFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate suggested amounts based on debt type
  const suggestedAmounts = React.useMemo(() => {
    const amounts: number[] = [];

    // Calculate monthly interest if applicable
    const monthlyInterest =
      debt.interestRate && debt.currentBalance
        ? debt.currentBalance * (debt.interestRate / 100 / 12)
        : 0;

    // For amortizing loans, suggest the monthly payment amount
    if (debt.repaymentTerms === "Amortizing" && debt.monthlyPaymentAmount) {
      amounts.push(debt.monthlyPaymentAmount);
    }

    // If there's interest, suggest interest-only payment
    if (monthlyInterest > 0) {
      amounts.push(monthlyInterest);
    }

    // Suggest 25%, 50%, and 100% of remaining balance
    if (debt.currentBalance > 0) {
      amounts.push(debt.currentBalance * 0.25);
      amounts.push(debt.currentBalance * 0.5);
      amounts.push(debt.currentBalance);
    }

    // Remove duplicates and sort
    return [...new Set(amounts)]
      .filter((amt) => amt > 0)
      .sort((a, b) => a - b)
      .slice(0, 4); // Limit to 4 suggestions
  }, [
    debt.currentBalance,
    debt.interestRate,
    debt.repaymentTerms,
    debt.monthlyPaymentAmount,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    try {
      const paymentAmount = parseFloat(amount);
      const paymentTimestamp = new Date(paymentDate).getTime();

      // Calculate monthly interest
      const monthlyInterest =
        debt.interestRate && debt.currentBalance
          ? debt.currentBalance * (debt.interestRate / 100 / 12)
          : 0;

      // Determine payment breakdown
      let interestPaid = 0;
      let principalPaid = 0;

      if (monthlyInterest > 0) {
        // If there's interest, apply payment to interest first
        interestPaid = Math.min(paymentAmount, monthlyInterest);
        principalPaid = Math.max(0, paymentAmount - interestPaid);
      } else {
        // No interest, all goes to principal
        principalPaid = paymentAmount;
      }

      // Determine payment type for tracking
      let paymentType: "interest_only" | "principal" | "both";
      if (interestPaid > 0 && principalPaid === 0) {
        paymentType = "interest_only";
      } else if (principalPaid > 0 && interestPaid === 0) {
        paymentType = "principal";
      } else {
        paymentType = "both";
      }

      // Create payment record and expense
      const paymentId = id();
      const expenseId = id();

      await db.transact([
        db.tx.debt_payments[paymentId]
          .update({
            amount: paymentAmount,
            paymentDate: paymentTimestamp,
            paymentType,
            interestAmount: interestPaid > 0 ? interestPaid : undefined,
            principalAmount: principalPaid > 0 ? principalPaid : undefined,
            createdAt: Date.now(),
          })
          .link({ debt: debt.id }),
        // Create expense for the debt payment
        db.tx.expenses[expenseId]
          .update({
            amount: paymentAmount,
            recipient: `Debt Payment - ${debt.debtor || "Unknown"}`,
            date: paymentTimestamp,
            category: "Debt Payment",
            rawMessage: `Debt payment of Ksh ${paymentAmount.toLocaleString()} for ${
              debt.debtor || "Unknown"
            }`,
            parsedData: {
              type: "debt_payment",
              debtId: debt.id,
              debtName: debt.debtor || "Unknown",
              paymentType,
              interestAmount: interestPaid > 0 ? interestPaid : undefined,
              principalAmount: principalPaid > 0 ? principalPaid : undefined,
            },
            createdAt: Date.now(),
          })
          .link({ profile: debt.profile?.id || "" }),
      ]);

      // Update debt based on payment breakdown
      const debtUpdates: {
        currentBalance?: number;
        pushMonthsCompleted?: number;
        lastInterestPaymentDate?: number;
        interestAccrued?: number;
      } = {};

      if (paymentType === "interest_only") {
        // Interest only - push to next month
        debtUpdates.pushMonthsCompleted = (debt.pushMonthsCompleted || 0) + 1;
        debtUpdates.lastInterestPaymentDate = paymentTimestamp;
        debtUpdates.interestAccrued =
          (debt.interestAccrued || 0) + interestPaid;
      } else if (paymentType === "principal") {
        // Principal only - reduce balance
        debtUpdates.currentBalance = Math.max(
          0,
          debt.currentBalance - principalPaid
        );
        debtUpdates.pushMonthsCompleted = 0;
      } else {
        // Both - reduce balance by principal, track interest
        debtUpdates.currentBalance = Math.max(
          0,
          debt.currentBalance - principalPaid
        );
        debtUpdates.interestAccrued =
          (debt.interestAccrued || 0) + interestPaid;
        debtUpdates.lastInterestPaymentDate = paymentTimestamp;
        if (principalPaid > 0) {
          debtUpdates.pushMonthsCompleted = 0;
        }
      }

      await db.transact(db.tx.debts[debt.id].update(debtUpdates));

      // Reset form
      setAmount("");
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

  const remainingPushMonths = debt.pushMonthsPlan
    ? Math.max(0, debt.pushMonthsPlan - (debt.pushMonthsCompleted || 0))
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {debt.pushMonthsPlan && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Push Progress:</span>
              <Badge variant="secondary">
                {debt.pushMonthsCompleted || 0} / {debt.pushMonthsPlan} months
              </Badge>
            </div>
            {remainingPushMonths !== null && remainingPushMonths > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {remainingPushMonths} month
                {remainingPushMonths !== 1 ? "s" : ""} remaining
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="payment-amount">Payment Amount (Ksh)</Label>
        <Input
          id="payment-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="0.01"
          placeholder="Enter amount"
        />
      </div>

      {suggestedAmounts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Suggested Amounts
          </Label>
          <ButtonGroup className="flex-wrap">
            {suggestedAmounts.map((suggestedAmount, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(suggestedAmount.toFixed(2))}
              >
                Ksh{" "}
                {suggestedAmount.toLocaleString("en-KE", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      )}

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
