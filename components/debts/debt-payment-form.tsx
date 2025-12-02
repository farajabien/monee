"use client";

import { useState, useEffect } from "react";
import React from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DebtWithUser, PaymentType } from "@/types";

interface DebtPaymentFormProps {
  debt: DebtWithUser;
  onSuccess?: () => void;
}

export function DebtPaymentForm({ debt, onSuccess }: DebtPaymentFormProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>("principal");
  const [amount, setAmount] = useState<string>("");
  const [interestAmount, setInterestAmount] = useState<string>("");
  const [principalAmount, setPrincipalAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate monthly interest
  const monthlyInterest =
    debt.interestRate && debt.currentBalance
      ? debt.currentBalance * (debt.interestRate / 100)
      : 0;

  // Auto-calculate amounts based on payment type
  const updateAmounts = (type: PaymentType) => {
    if (type === "interest_only") {
      setInterestAmount(monthlyInterest.toFixed(2));
      setPrincipalAmount("0");
      setAmount(monthlyInterest.toFixed(2));
    } else if (type === "principal") {
      setInterestAmount("0");
      setPrincipalAmount(debt.monthlyPaymentAmount.toString());
      setAmount(debt.monthlyPaymentAmount.toString());
    } else {
      // both
      setInterestAmount(monthlyInterest.toFixed(2));
      const principal = debt.monthlyPaymentAmount - monthlyInterest;
      setPrincipalAmount(Math.max(0, principal).toFixed(2));
      setAmount(debt.monthlyPaymentAmount.toString());
    }
  };

  // Update amounts when payment type changes
  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    updateAmounts(type);
  };

  // Initialize amounts on mount and when payment type or debt changes
  useEffect(() => {
    updateAmounts(paymentType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentType,
    debt.currentBalance,
    debt.interestRate,
    debt.monthlyPaymentAmount,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    try {
      const paymentAmount = parseFloat(amount);
      const interestPaid = parseFloat(interestAmount || "0");
      const principalPaid = parseFloat(principalAmount || "0");
      const paymentTimestamp = new Date(paymentDate).getTime();

      // Create payment record and expense expense
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
        // Create expense expense for the debt payment
        db.tx.expenses[expenseId]
          .update({
            amount: paymentAmount,
            recipient: `Debt Payment - ${debt.name}`,
            date: paymentTimestamp,
            category: "Debt Payment",
            rawMessage: `Debt payment of Ksh ${paymentAmount.toLocaleString()} for ${
              debt.name
            } (${paymentType})`,
            parsedData: {
              type: "debt_payment",
              debtId: debt.id,
              debtName: debt.name,
              paymentType,
              interestAmount: interestPaid > 0 ? interestPaid : undefined,
              principalAmount: principalPaid > 0 ? principalPaid : undefined,
            },
            createdAt: Date.now(),
          })
          .link({ profile: debt.profile?.id || "" }),
      ]);

      // Update debt based on payment type
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
        // Do NOT reduce currentBalance
      } else if (paymentType === "principal") {
        // Principal only - reduce balance
        debtUpdates.currentBalance = Math.max(
          0,
          debt.currentBalance - principalPaid
        );
        // Reset push months if paying principal
        if (principalPaid > 0) {
          debtUpdates.pushMonthsCompleted = 0;
        }
      } else {
        // Both - reduce balance by principal, track interest
        debtUpdates.currentBalance = Math.max(
          0,
          debt.currentBalance - principalPaid
        );
        debtUpdates.interestAccrued =
          (debt.interestAccrued || 0) + interestPaid;
        debtUpdates.lastInterestPaymentDate = paymentTimestamp;
        // Reset push months if paying principal
        if (principalPaid > 0) {
          debtUpdates.pushMonthsCompleted = 0;
        }
      }

      await db.transact(db.tx.debts[debt.id].update(debtUpdates));

      // Reset form
      updateAmounts(paymentType);
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
        <Label htmlFor="payment-type">Payment Type</Label>
        <Select value={paymentType} onValueChange={handlePaymentTypeChange}>
          <SelectTrigger id="payment-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interest_only">
              Interest Only (Push to Next Month)
            </SelectItem>
            <SelectItem value="principal">Principal Only</SelectItem>
            <SelectItem value="both">Both Interest & Principal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType === "interest_only" && monthlyInterest > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Interest:</span>
                <span className="font-medium">
                  Ksh{" "}
                  {monthlyInterest.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Paying this will push your debt to next month without reducing
                principal.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="payment-amount">Total Payment Amount (Ksh)</Label>
        <Input
          id="payment-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>

      {paymentType === "both" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interest-amount">Interest Amount (Ksh)</Label>
            <Input
              id="interest-amount"
              type="number"
              value={interestAmount}
              onChange={(e) => {
                setInterestAmount(e.target.value);
                const total =
                  parseFloat(e.target.value || "0") +
                  parseFloat(principalAmount || "0");
                setAmount(total.toFixed(2));
              }}
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="principal-amount">Principal Amount (Ksh)</Label>
            <Input
              id="principal-amount"
              type="number"
              value={principalAmount}
              onChange={(e) => {
                setPrincipalAmount(e.target.value);
                const total =
                  parseFloat(interestAmount || "0") +
                  parseFloat(e.target.value || "0");
                setAmount(total.toFixed(2));
              }}
              min="0"
              step="0.01"
            />
          </div>
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
