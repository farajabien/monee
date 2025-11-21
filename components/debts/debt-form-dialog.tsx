"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Debt } from "@/types";

interface DebtFormDialogProps {
  debt?: Debt | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DebtFormDialog({ debt, trigger, open, onOpenChange }: DebtFormDialogProps) {
  const user = db.useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<string>("");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [paymentDueDay, setPaymentDueDay] = useState<number>(1);
  const [interestRate, setInterestRate] = useState<string>("");
  const [pushMonthsPlan, setPushMonthsPlan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange !== undefined ? onOpenChange : setIsOpen;

  // Initialize form if editing
  useEffect(() => {
    if (debt && dialogOpen) {
      setName(debt.name);
      setTotalAmount(debt.totalAmount.toString());
      setCurrentBalance(debt.currentBalance.toString());
      setMonthlyPaymentAmount(debt.monthlyPaymentAmount.toString());
      setPaymentDueDay(debt.paymentDueDay);
      setInterestRate(debt.interestRate?.toString() || "");
      setPushMonthsPlan(debt.pushMonthsPlan?.toString() || "");
    }
  }, [debt, dialogOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !totalAmount ||
      !currentBalance ||
      !monthlyPaymentAmount
    )
      return;

    setIsSubmitting(true);
    try {
      const debtData = {
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        currentBalance: parseFloat(currentBalance),
        monthlyPaymentAmount: parseFloat(monthlyPaymentAmount),
        paymentDueDay,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        pushMonthsPlan: pushMonthsPlan ? parseInt(pushMonthsPlan, 10) : undefined,
        pushMonthsCompleted: debt?.pushMonthsCompleted || 0,
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
      setPushMonthsPlan("");

      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving debt:", error);
      alert("Failed to save debt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !open && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Debt
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
          <DialogDescription>
            {debt
              ? "Update your debt information"
              : "Track a new debt and set up monthly payment rules"}
          </DialogDescription>
        </DialogHeader>

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
                onChange={(e) =>
                  setPaymentDueDay(parseInt(e.target.value, 10) || 1)
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate % (Optional)</Label>
              <Input
                id="interest-rate"
                type="number"
                placeholder="15"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="push-months-plan">Push Months Plan (Optional)</Label>
              <Input
                id="push-months-plan"
                type="number"
                placeholder="5"
                value={pushMonthsPlan}
                onChange={(e) => setPushMonthsPlan(e.target.value)}
                min="0"
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Months to pay interest only before paying principal
              </p>
            </div>
          </div>

          {interestRate && currentBalance && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Interest:</span>
                    <span className="font-medium">
                      Ksh{" "}
                      {(
                        parseFloat(currentBalance || "0") *
                        (parseFloat(interestRate || "0") / 100)
                      ).toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {pushMonthsPlan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Interest (if pushing {pushMonthsPlan} months):
                      </span>
                      <span className="font-medium">
                        Ksh{" "}
                        {(
                          parseFloat(currentBalance || "0") *
                          (parseFloat(interestRate || "0") / 100) *
                          parseInt(pushMonthsPlan || "0", 10)
                        ).toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
