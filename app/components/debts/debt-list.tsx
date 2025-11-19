"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { DebtForm } from "./debt-form";
import type { DebtWithUser } from "@/types";

export function DebtList() {
  const user = db.useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtWithUser | null>(null);

  const { isLoading, error, data } = db.useQuery({
    debts: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const debts: DebtWithUser[] = data?.debts || [];

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading debts...</div>
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

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.currentBalance, 0),
    [debts]
  );

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
                <span className="text-sm font-medium">Total Debt Remaining</span>
                <span className="text-xl font-bold">{formatAmount(totalDebt)}</span>
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
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{debt.name}</span>
                              {debt.interestRate && (
                                <Badge variant="outline">
                                  {debt.interestRate}% interest
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Balance: {formatAmount(debt.currentBalance)} /{" "}
                                {formatAmount(debt.totalAmount)}
                              </span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due day {debt.paymentDueDay}</span>
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Monthly payment: </span>
                              <span className="font-medium">
                                {formatAmount(debt.monthlyPaymentAmount)}
                              </span>
                            </div>
                            {payoffMonths && (
                              <div className="text-xs text-muted-foreground">
                                {payoffMonths} month{payoffMonths !== 1 ? "s" : ""} to pay off
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
                            {formatAmount(debt.totalAmount - debt.currentBalance)} paid
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
    </div>
  );
}

