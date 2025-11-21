"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { DebtForm } from "./debt-form";
import { DebtPaymentForm } from "./debt-payment-form";
import type { DebtWithUser } from "@/types";

export function DebtList() {
  const user = db.useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtWithUser | null>(null);
  const [selectedDebtForPayment, setSelectedDebtForPayment] =
    useState<DebtWithUser | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { isLoading, error, data } = db.useQuery({
    debts: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const debts: DebtWithUser[] = useMemo(() => data?.debts || [], [data?.debts]);

  const handleDelete = (debtId: string) => {
    if (confirm("Are you sure you want to delete this debt?")) {
      db.transact(db.tx.debts[debtId].delete());
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (debt: DebtWithUser) => {
    if (debt.totalAmount === 0) return 100;
    const paid = debt.totalAmount - debt.currentBalance;
    return (paid / debt.totalAmount) * 100;
  };

  const calculatePayoffMonths = (debt: DebtWithUser) => {
    if (debt.monthlyPaymentAmount === 0) return null;
    return Math.ceil(debt.currentBalance / debt.monthlyPaymentAmount);
  };

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.currentBalance, 0),
    [debts]
  );

  // Check if today is the due day for a debt
  const isDueToday = (debt: DebtWithUser) => {
    const today = new Date();
    return today.getDate() === debt.paymentDueDay;
  };

  // Quick push action - automatically record interest-only payment and push 1 month
  const handleQuickPush = async (debt: DebtWithUser) => {
    if (!debt.interestRate || debt.currentBalance === 0) {
      alert("This debt doesn't have an interest rate or is already paid off.");
      return;
    }

    try {
      const monthlyInterest =
        (debt.currentBalance * debt.interestRate) / 100 / 12;
      const paymentTimestamp = Date.now();

      // Create interest-only payment record
      await db.transact(
        db.tx.debt_payments[id()]
          .update({
            amount: monthlyInterest,
            paymentDate: paymentTimestamp,
            paymentType: "interest_only",
            interestAmount: monthlyInterest,
            principalAmount: 0,
            createdAt: Date.now(),
          })
          .link({ debt: debt.id })
      );

      // Update debt - push to next month
      await db.transact(
        db.tx.debts[debt.id].update({
          pushMonthsCompleted: (debt.pushMonthsCompleted || 0) + 1,
          lastInterestPaymentDate: paymentTimestamp,
          interestAccrued: (debt.interestAccrued || 0) + monthlyInterest,
        })
      );

      alert("Payment recorded! Debt pushed to next month.");
    } catch (error) {
      console.error("Error recording quick push:", error);
      alert("Failed to record payment. Please try again.");
    }
  };

  // Handle paid button - opens payment form
  const handlePaid = (debt: DebtWithUser) => {
    setSelectedDebtForPayment(debt);
    setShowPaymentDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading debts...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Debts</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingDebt(null);
              setShowAddForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="p-4 border rounded-lg">
              <DebtForm
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {editingDebt && (
            <div className="p-4 border rounded-lg">
              <DebtForm
                debt={editingDebt}
                onSuccess={() => setEditingDebt(null)}
                onCancel={() => setEditingDebt(null)}
              />
            </div>
          )}

          {debts.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Total Debt Remaining
                </span>
                <span className="text-xl font-bold">
                  {formatAmount(totalDebt)}
                </span>
              </div>
            </div>
          )}

          {debts.length === 0 && !showAddForm && !editingDebt ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-2">No debts tracked yet.</p>
              <p className="text-sm">Add your debts to start managing them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((debt) => {
                const progress = calculateProgress(debt);
                const payoffMonths = calculatePayoffMonths(debt);
                return (
                  <Card key={debt.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{debt.name}</span>
                              {debt.interestRate && (
                                <Badge variant="outline">
                                  {debt.interestRate}% interest
                                </Badge>
                              )}
                              {debt.pushMonthsPlan && (
                                <Badge variant="secondary">
                                  Push: {debt.pushMonthsCompleted || 0}/
                                  {debt.pushMonthsPlan}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span>
                                Balance: {formatAmount(debt.currentBalance)} /{" "}
                                {formatAmount(debt.totalAmount)}
                              </span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due day {debt.paymentDueDay}</span>
                              </div>
                              {debt.interestAccrued &&
                                debt.interestAccrued > 0 && (
                                  <span className="text-amber-600">
                                    Interest paid:{" "}
                                    {formatAmount(debt.interestAccrued)}
                                  </span>
                                )}
                              {debt.lastInterestPaymentDate && (
                                <span className="text-xs">
                                  Last interest:{" "}
                                  {new Date(
                                    debt.lastInterestPaymentDate
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Monthly payment:{" "}
                              </span>
                              <span className="font-medium">
                                {formatAmount(debt.monthlyPaymentAmount)}
                              </span>
                            </div>
                            {payoffMonths && (
                              <div className="text-xs text-muted-foreground">
                                {payoffMonths} month
                                {payoffMonths !== 1 ? "s" : ""} to pay off
                              </div>
                            )}
                            {/* Quick actions for due day */}
                            {isDueToday(debt) && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handlePaid(debt)}
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Paid
                                </Button>
                                {debt.interestRate && debt.interestRate > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickPush(debt)}
                                    className="flex items-center gap-1"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                    Push 1 Month
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowAddForm(false);
                                setEditingDebt(debt);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(debt.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}% paid off</span>
                          <span>
                            {formatAmount(
                              debt.totalAmount - debt.currentBalance
                            )}{" "}
                            paid
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedDebtForPayment && (
            <DebtPaymentForm
              debt={selectedDebtForPayment}
              onSuccess={() => {
                setShowPaymentDialog(false);
                setSelectedDebtForPayment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
