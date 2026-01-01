"use client";

import { useState } from "react";
import { format } from "date-fns";
import {  RotateCcw, Plus } from "lucide-react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import type { Debt, DebtPayment } from "@/types";

interface DebtDetailsDialogProps {
  debt: Debt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
}

export function DebtDetailsDialog({
  debt,
  open,
  onOpenChange,
  profileId,
}: DebtDetailsDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<"interest" | "principal">("principal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch payments via relation
  const { data } = db.useQuery({
    debts: {
      $: {
        where: {
          id: debt.id,
        },
      },
      payments: {
        $: {
          order: {
            date: "desc",
          },
        },
      },
    },
  });

  const freshDebt = data?.debts?.[0] || debt;
  const payments = ((data?.debts?.[0] as any)?.payments || []) as DebtPayment[];

  const handleAddPayment = async () => {
    if (!amount || !profileId) return;
    
    setIsSubmitting(true);
    try {
        const payAmount = parseFloat(amount);
        const paymentId = id();
        const expenseId = id();
        const now = new Date(paymentDate).getTime();

        const txs: any[] = [];

        // 1. Create Payment Record
        txs.push(
            db.tx.debt_payments[paymentId].update({
                amount: payAmount,
                date: now,
                type: paymentType,
                expenseId: expenseId, // Link to expense
            }).link({ debt: debt.id })
        );

        // 2. Create Expense
        txs.push(
            db.tx.expenses[expenseId].update({
                amount: payAmount,
                date: now,
                category: "Debt Repayment",
                recipient: debt.personName,
                notes: `Repayment for ${debtType === "shylock" ? (paymentType === "interest" ? "Interest Only" : "Principal Payment") : "Loan"}`,
                createdAt: Date.now(),
            }).link({ profile: profileId })
        );

        // 3. Update Debt Balance
        // If Standard: Reduce currentBalance by payAmount.
        // If Shylock: 
        //    - If Interest Only: Balance does NOT change (it pays off the accrued interest).
        //    - If Principal: Balance reduces.
        
        let newBalance = freshDebt.currentBalance || 0;
        
        if (debtType === "shylock") {
            if (paymentType === "principal") {
                newBalance -= payAmount;
            }
            // Interest payments don't reduce principal/balance in this model 
            // (assuming balance tracks principal. Wait, Shylock balance is tricky).
            // User said: "I can always be paying monthly interest to keep the loan at the same level".
            // So Balance = Principal.
        } else {
            // Standard
            newBalance -= payAmount;
        }

        txs.push(
            db.tx.debts[debt.id].update({
                currentBalance: newBalance,
                // optional: update isPaidOff if 0
                isPaidOff: newBalance <= 0
            })
        );

        await db.transact(txs);
        toast.success("Payment recorded!");
        setAmount("");
    } catch (error) {
        console.error(error);
        toast.error("Failed to record payment");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRevertPayment = async (payment: any) => {
      if (!confirm("Revert this payment? It will restore the balance and delete the expense.")) return;

      try {
          const txs: any[] = [];
          
          // 1. Delete Payment
          txs.push(db.tx.debt_payments[payment.id].delete());

          // 2. Delete Linked Expense
          if (payment.expenseId) {
              txs.push(db.tx.expenses[payment.expenseId].delete());
          }

          // 3. Restore Balance
          if (payment.type === "principal" || freshDebt.debtType !== "shylock") {
              const newBalance = (freshDebt.currentBalance || 0) + payment.amount;
               txs.push(
                db.tx.debts[freshDebt.id].update({
                    currentBalance: newBalance,
                    isPaidOff: newBalance <= 0 // Re-evaluate logic? If adding back, likely > 0
                })
            );
          }

          await db.transact(txs);
          toast.success("Reverted payment");
      } catch (error) {
          console.error(error);
          toast.error("Failed to revert");
      }
  };

  const debtType = freshDebt.debtType || "friend";
  const interestRate = freshDebt.interestRate || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debt Details: {freshDebt.personName}</DialogTitle>
          <DialogDescription>
             {debtType === "shylock" ? "Shylock Loan (Interest Bearing)" : "Standard Loan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Current Balance</p>
                    <p className={`text-xl font-bold ${(freshDebt.currentBalance || 0) > 0 ? "text-red-500" : "text-green-500"}`}>
                        {formatCurrency(freshDebt.currentBalance || 0, DEFAULT_CURRENCY)}
                    </p>
                    {debtType === "shylock" && (
                         <p className="text-xs mt-1 text-orange-500 font-medium">
                            {interestRate}% Monthly Interest
                         </p>
                    )}
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Next Interest</p>
                     {debtType === "shylock" ? (
                        <p className="text-lg font-bold text-orange-600">
                             {formatCurrency((freshDebt.currentBalance || 0) * (interestRate / 100), DEFAULT_CURRENCY)}
                        </p>
                     ) : (
                        <p className="text-lg font-bold">N/A</p>
                     )}
                     <p className="text-xs text-muted-foreground">Due Monthly</p>
                </div>
            </div>

            {/* Add Payment Section */}
            <div className="space-y-3 p-4 border rounded-xl bg-card">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Record Repayment
                </h3>
                
                {debtType === "shylock" && (
                    <div className="flex gap-2">
                        <Button
                           size="sm"
                           variant={paymentType === "interest" ? "default" : "outline"}
                           onClick={() => setPaymentType("interest")}
                           className="flex-1 text-xs"
                        >
                            Interest Only
                        </Button>
                        <Button
                           size="sm"
                           variant={paymentType === "principal" ? "default" : "outline"}
                           onClick={() => setPaymentType("principal")}
                           className="flex-1 text-xs"
                        >
                            Principal + Interest
                        </Button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button onClick={handleAddPayment} disabled={isSubmitting || !amount}>
                        Pay
                    </Button>
                </div>
                {debtType === "shylock" && paymentType === "interest" && (
                    <p className="text-xs text-muted-foreground">
                        * Pays off interest only. Principal balance remains unchanged.
                    </p>
                )}
            </div>

            {/* Payment History */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm">Payment History</h3>
                {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {payments.map((p) => (
                            <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/10">
                                <div>
                                    <p className="font-medium text-sm">
                                        {p.type === "interest" ? "Interest Payment" : "Repayment"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(p.date), "dd MMM yyyy")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-green-600">
                                        -{formatCurrency(p.amount, DEFAULT_CURRENCY)}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRevertPayment(p)}
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
