import { useState, useEffect } from "react";
import { format } from "date-fns";
import {  RotateCcw, Plus, Pen, Save, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(debt.personName);
  const [editType, setEditType] = useState<"friend" | "shylock">((debt.debtType as "friend" | "shylock") || "friend");
  const [editRate, setEditRate] = useState(debt.interestRate?.toString() || "0");
  const [editBalance, setEditBalance] = useState(debt.currentBalance?.toString() || "0");
  // Principal (Original Amount) matches balance initially if not set
  const [editPrincipal, setEditPrincipal] = useState((debt.amount || debt.currentBalance || 0).toString());

  const [editDate, setEditDate] = useState(
    debt.date ? new Date(debt.date).toISOString().split("T")[0] : 
    debt.createdAt ? new Date(debt.createdAt).toISOString().split("T")[0] : 
    new Date().toISOString().split("T")[0]
  );
  
  // Historic Reconciliation State
  const [historicPayments, setHistoricPayments] = useState<Record<string, string>>({});

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

  // Sync edit state with fresh data when opening/viewing
  useEffect(() => {
    if (freshDebt && !isEditing) {
        setEditName(freshDebt.personName);
        setEditType((freshDebt.debtType as any) || "friend");
        setEditRate(freshDebt.interestRate?.toString() || "0");
        setEditBalance(freshDebt.currentBalance?.toString() || "0");
        setEditPrincipal((freshDebt.amount || freshDebt.currentBalance || 0).toString());
        setEditDate(
            freshDebt.date ? new Date(freshDebt.date).toISOString().split("T")[0] : 
            freshDebt.createdAt ? new Date(freshDebt.createdAt).toISOString().split("T")[0] : 
            new Date().toISOString().split("T")[0]
        );
        setHistoricPayments({});
    }
  }, [freshDebt, isEditing]);

  // Generate list of months for reconciliation
  const getReconciliationMonths = () => {
      // ... previous logic unchanged ...
      if (!editDate) return [];
      const start = new Date(editDate);
      const now = new Date();
      
      const months = [];
      const current = new Date(start);
      current.setMonth(current.getMonth() + 1); 

      if (isNaN(current.getTime())) return [];

      while (current < now || (current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear())) {
          months.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
      }
      return months;
  };

  const reconciliationMonths = isEditing && editType === "shylock" ? getReconciliationMonths() : [];

  // Calculate projected balance based on history inputs
  const calculateReconciledBalance = () => {
      // If reconciling, we start with Principal (`editPrincipal`), not Balance
      // Because Balance is what we are trying to CALCULATE.
      // So `editPrincipal` acts as the "Starting Loan Amount".
      
      let balance = parseFloat(editPrincipal) || parseFloat(editBalance) || 0; 
      const rate = parseFloat(editRate) || 0;
      let runningBalance = balance;
      
      reconciliationMonths.forEach(date => {
          const key = date.toISOString().slice(0, 7); // YYYY-MM
          const payment = parseFloat(historicPayments[key] || "0");
          // Interest is on Principal (assuming simple interest logic user wants?) 
          // OR is it compounding? User said "balance is still 100k plus 15k interest". 
          // This implies Interest accumulates but doesn't compound into principal immediately?
          // Shylock standard: Interest is fixed % on Principal.
          // Let's assume Interest = Principal * Rate. 
          // If we add it to running balance, it becomes part of balance.
          // User: "100k plus 15k interest" -> 115k.
          // Next month interest: 15% of 100k (Principal). NOT 115k.
          
          const principalAmount = parseFloat(editPrincipal) || balance; 
          const interest = principalAmount * (rate / 100);
          
          runningBalance = runningBalance + interest - payment;
      });
      
      return runningBalance;
  };

  const projectedBalance = reconciliationMonths.length > 0 ? calculateReconciledBalance() : parseFloat(editBalance);

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
            // Interest payments don't reduce principal
        } else {
            // Standard
            newBalance -= payAmount;
        }

        txs.push(
            db.tx.debts[debt.id].update({
                currentBalance: newBalance,
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
                    isPaidOff: newBalance <= 0
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

  const handleSaveEdit = async () => {
      try {
          const txs: any[] = [];
          
          let finalBalance = parseFloat(editBalance) || 0;
          const finalPrincipal = parseFloat(editPrincipal) || finalBalance;
          const newDate = new Date(editDate).getTime();
          
          // 1. Process Historical Payments if validated
          if (reconciliationMonths.length > 0) {
              finalBalance = calculateReconciledBalance(); 
              // ... payment creation logic (same as before) ...
              
               reconciliationMonths.forEach(date => {
                  const key = date.toISOString().slice(0, 7);
                  const amount = parseFloat(historicPayments[key] || "0");
                  
                  if (amount > 0) {
                       const paymentId = id();
                       const expenseId = id();
                       const paymentDate = date.getTime();
                       const type = "interest"; 

                       txs.push(
                           db.tx.debt_payments[paymentId].update({
                               amount: amount,
                               date: paymentDate,
                               type: type,
                               expenseId: expenseId,
                               notes: "Historical reconciliation payment"
                           }).link({ debt: freshDebt.id })
                       );

                       txs.push(
                            db.tx.expenses[expenseId].update({
                                amount: amount,
                                date: paymentDate,
                                category: "Debt Repayment",
                                recipient: editName,
                                notes: `Historical repayment for ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
                                createdAt: Date.now(),
                            }).link({ profile: profileId })
                       );
                  }
              });
          }

          // 2. Update Debt Record
          txs.push(
              db.tx.debts[freshDebt.id].update({
                  personName: editName,
                  debtType: editType,
                  interestRate: parseFloat(editRate) || 0,
                  currentBalance: finalBalance,
                  amount: finalPrincipal, // Save Principal explicitly
                  date: newDate,
              })
          );
          
          await db.transact(txs);
          toast.success("Debt updated & reconciled");
          setIsEditing(false);
      } catch (error) {
          console.error(error);
          toast.error("Failed to update debt");
      }
  };

  const debtType = freshDebt.debtType || "friend";
  const interestRate = freshDebt.interestRate || 0;
  // Use explicit amount as principal, or fallback to balance if not set (legacy)
  const principal = freshDebt.amount || freshDebt.currentBalance || 0; 
  const nextInterest = principal * (interestRate / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
            {/* Unchanged Header */}
             <div className="space-y-1 text-left">
             <DialogTitle className="flex items-center gap-2">
                 {isEditing ? "Edit Debt" : `Debt Details: ${freshDebt.personName}`}
             </DialogTitle>
             <DialogDescription>
                {isEditing ? "Modify configuration" : (debtType === "shylock" ? "Shylock Loan" : "Standard Loan")}
             </DialogDescription>
          </div>
          {!isEditing ? (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                  <Pen className="h-4 w-4" />
              </Button>
          ) : (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
              </Button>
          )}
        </DialogHeader>

        {isEditing ? (
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Person / Source Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <Label>Type</Label>
                         <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="shylock">Shylock</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                     <div className="space-y-2">
                         <Label>Date Taken</Label>
                         <Input 
                            type="date" 
                            value={editDate} 
                            onChange={(e) => setEditDate(e.target.value)} 
                         />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Original Principal</Label>
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={editPrincipal} 
                        onChange={(e) => setEditPrincipal(e.target.value)} 
                    />
                     <p className="text-xs text-muted-foreground">The initial amount borrowed.</p>
                </div>

                <div className="space-y-2">
                    <Label>{reconciliationMonths.length > 0 ? "Initial Principal" : "Current Balance"}</Label>
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={editBalance} 
                        onChange={(e) => setEditBalance(e.target.value)} 
                    />
                    {reconciliationMonths.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                            Calculated automatically based on history.
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Total currently owed (Principal + Unpaid Interest).</p>
                    )}
                </div>

                {editType === "shylock" && (
                    <div className="space-y-2">
                         <Label>Monthly Interest Rate (%)</Label>
                         <Input 
                            type="number" 
                            step="0.1" 
                            value={editRate} 
                            onChange={(e) => setEditRate(e.target.value)} 
                         />
                    </div>
                )}
                
                {/* Reconciliation Wizard UI code reuse ... */}
                {reconciliationMonths.length > 0 && (
                    <div className="rounded-lg border bg-accent/10 p-4 space-y-4 mt-2">
                        {/* ... same wizard UI ... */}
                         <div className="flex items-center gap-2 mb-2">
                             <RotateCcw className="h-4 w-4 text-orange-500" />
                             <h4 className="font-semibold text-sm">Historic Reconciliation</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter payments made for past months to calculate current balance.
                        </p>
                        
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                            {reconciliationMonths.map((date, idx) => {
                                const key = date.toISOString().slice(0, 7);
                                return (
                                    <div key={key} className="flex items-center justify-between text-sm gap-2">
                                        <span className="w-24 font-mono text-xs">
                                            {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                        </span>
                                        <Input
                                            className="h-8 flex-1"
                                            placeholder="Paid Amount"
                                            type="number"
                                            value={historicPayments[key] || ""}
                                            onChange={(e) => setHistoricPayments({...historicPayments, [key]: e.target.value})}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="pt-2 border-t flex justify-between items-center">
                             <span className="text-sm font-medium">Projected Balance:</span>
                             <span className="font-bold text-lg text-primary">
                                 {formatCurrency(projectedBalance, DEFAULT_CURRENCY)}
                             </span>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex gap-2">
                    <Button className="flex-1" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>
        ) : (
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
                                Principal: {formatCurrency(principal, DEFAULT_CURRENCY)}
                            </p>
                        )}
                    </div>
                    <div className="p-4 bg-accent/20 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Monthly Interest</p>
                        {debtType === "shylock" ? (
                            <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(nextInterest, DEFAULT_CURRENCY)}
                            </p>
                        ) : (
                            <p className="text-lg font-bold">N/A</p>
                        )}
                        <p className="text-xs text-muted-foreground">Due Monthly</p>
                    </div>
                </div>

                {/* Total Paid vs Taken Summary (Visible especially if paid off or has payments) */}
                {payments.length > 0 && (
                    <div className="p-3 border rounded-lg bg-card mt-2">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Total Repaid:</span>
                            <span className="font-semibold text-green-600">
                                {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0), DEFAULT_CURRENCY)}
                            </span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Original Principal:</span>
                            <span className="font-medium">
                                {formatCurrency(principal, DEFAULT_CURRENCY)}
                            </span>
                        </div>
                        {debtType === "shylock" && (
                            <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs">
                                <span className="text-orange-500 font-medium">Interest Paid:</span>
                                <span>
                                     {formatCurrency(payments.filter(p => p.type === "interest").reduce((sum, p) => sum + p.amount, 0), DEFAULT_CURRENCY)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Payment Section */}
                <div className="space-y-3 p-2 border rounded-xl bg-card">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
