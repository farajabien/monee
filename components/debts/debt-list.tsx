"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Item } from "@/components/ui/item";
import { DataViewControls } from "@/components/ui/data-view-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  ArrowRight,
  DollarSign,
  TrendingDown,
  Clock,
} from "lucide-react";
import { DebtFormDialog } from "./debt-form-dialog";
import { DebtPaymentForm } from "./debt-payment-form";
import type { DebtWithUser } from "@/types";

export function DebtList() {
  const user = db.useUser();
  const [editingDebt, setEditingDebt] = useState<DebtWithUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] =
    useState<DebtWithUser | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [deletingDebt, setDeletingDebt] = useState<DebtWithUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("balance-high");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };

  const { data } = db.useQuery({
    debts: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const debts: DebtWithUser[] = useMemo(() => data?.debts || [], [data?.debts]);

  // Filter and sort debts
  const filteredAndSortedDebts = useMemo(() => {
    let result = [...debts];

    if (searchQuery) {
      result = result.filter((d) => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => {
        if (statusFilter === "active") return d.currentBalance > 0;
        if (statusFilter === "paid") return d.currentBalance === 0;
        if (statusFilter === "due-today") return isDueToday(d);
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "balance-high":
          return b.currentBalance - a.currentBalance;
        case "balance-low":
          return a.currentBalance - b.currentBalance;
        case "progress":
          return calculateProgress(b) - calculateProgress(a);
        case "due-day":
          return a.paymentDueDay - b.paymentDueDay;
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
        default:
          return b.currentBalance - a.currentBalance;
      }
    });

    return result;
  }, [debts, searchQuery, statusFilter, sortBy]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  const metrics = useMemo(() => {
    const activeDebts = filteredAndSortedDebts.filter(d => d.currentBalance > 0);
    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalOriginal = activeDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
    const totalPaid = totalOriginal - totalDebt;
    const avgProgress = activeDebts.length > 0 
      ? activeDebts.reduce((sum, d) => sum + calculateProgress(d), 0) / activeDebts.length 
      : 0;
    
    return { totalDebt, totalPaid, activeCount: activeDebts.length, avgProgress };
  }, [filteredAndSortedDebts]);

  const isDueToday = (debt: DebtWithUser) => {
    const today = new Date();
    return today.getDate() === debt.paymentDueDay;
  };

  const handleQuickPush = async (debt: DebtWithUser) => {
    if (!debt.interestRate || debt.currentBalance === 0) {
      alert("This debt doesn't have an interest rate or is already paid off.");
      return;
    }

    try {
      const monthlyInterest =
        (debt.currentBalance * debt.interestRate) / 100 / 12;
      const paymentTimestamp = Date.now();

      const paymentId = id();
      const transactionId = id();
      
      await db.transact([
        db.tx.debt_payments[paymentId]
          .update({
            amount: monthlyInterest,
            paymentDate: paymentTimestamp,
            paymentType: "interest_only",
            interestAmount: monthlyInterest,
            principalAmount: 0,
            createdAt: Date.now(),
          })
          .link({ debt: debt.id }),
        db.tx.transactions[transactionId]
          .update({
            amount: monthlyInterest,
            recipient: `Debt Payment - ${debt.name}`,
            date: paymentTimestamp,
            category: "Debt Payment",
            rawMessage: `Interest payment of Ksh ${monthlyInterest.toLocaleString()} for ${debt.name} (Quick Push)`,
            parsedData: {
              type: "debt_payment",
              debtId: debt.id,
              debtName: debt.name,
              paymentType: "interest_only",
              interestAmount: monthlyInterest,
              principalAmount: 0,
            },
            createdAt: Date.now(),
          })
          .link({ user: debt.user?.id || "" }),
      ]);

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

  const handlePaid = (debt: DebtWithUser) => {
    setSelectedDebtForPayment(debt);
    setShowPaymentDialog(true);
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Debts</CardTitle>
          <DebtFormDialog />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Metrics */}
          {metrics.activeCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <DollarSign className="h-3 w-3 mr-1" />
                Ksh {formatCompact(metrics.totalDebt)}
              </Badge>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <TrendingDown className="h-3 w-3 mr-1" />
                {metrics.activeCount} Active
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                <Clock className="h-3 w-3 mr-1" />
                {metrics.avgProgress.toFixed(0)}% Avg Progress
              </Badge>
            </div>
          )}

          <DataViewControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search debts..."
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: "balance-high", label: "Balance ↓" },
              { value: "balance-low", label: "Balance ↑" },
              { value: "progress", label: "Progress" },
              { value: "due-day", label: "Due Day" },
              { value: "deadline", label: "Deadline" },
            ]}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "paid", label: "Paid Off" },
              { value: "due-today", label: "Due Today" },
            ]}
            filterLabel="Status"
            totalCount={debts.length}
            filteredCount={filteredAndSortedDebts.length}
          />

          {editingDebt && (
            <DebtFormDialog
              debt={editingDebt}
              open={showEditDialog}
              onOpenChange={(open) => {
                setShowEditDialog(open);
                if (!open) setEditingDebt(null);
              }}
            />
          )}

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Debt</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Delete &quot;{deletingDebt?.name}&quot;? This will remove all payment records.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeletingDebt(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (deletingDebt) {
                      db.transact(db.tx.debts[deletingDebt.id].delete());
                      setShowDeleteDialog(false);
                      setDeletingDebt(null);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {filteredAndSortedDebts.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              {searchQuery || statusFilter !== "all" ? (
                <p className="text-sm">No debts found matching your filters.</p>
              ) : (
                <>
                  <p className="text-sm mb-1">No debts tracked yet</p>
                  <p className="text-xs">Add debts to manage payments</p>
                </>
              )}
            </div>
          )}

          {filteredAndSortedDebts.length > 0 && viewMode === "list" && (
            <div className="space-y-2">
              {filteredAndSortedDebts.map((debt, index) => {
                const progress = calculateProgress(debt);
                const payoffMonths = calculatePayoffMonths(debt);
                return (
                  <Item key={debt.id} variant="outline" className="flex-col items-stretch p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          #{index + 1}
                        </Badge>
                        <span className="font-semibold text-sm">{debt.name}</span>
                        {debt.interestRate && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {debt.interestRate}%
                          </Badge>
                        )}
                        {debt.pushMonthsPlan && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {debt.pushMonthsCompleted || 0}/{debt.pushMonthsPlan}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingDebt(debt);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => {
                            setDeletingDebt(debt);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formatAmount(debt.currentBalance)} / {formatAmount(debt.totalAmount)}
                        </span>
                        <span className="font-medium">
                          {formatAmount(debt.monthlyPaymentAmount)}/mo
                        </span>
                      </div>

                      <Progress value={progress} className="h-1.5" />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(1)}% paid</span>
                        {payoffMonths && <span>{payoffMonths}mo left</span>}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          Day {debt.paymentDueDay}
                        </div>
                        {debt.deadline && (
                          <span>
                            Due: {new Date(debt.deadline).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {debt.interestAccrued && debt.interestAccrued > 0 && (
                          <span className="text-amber-600">
                            Interest: {formatAmount(debt.interestAccrued)}
                          </span>
                        )}
                      </div>

                      {isDueToday(debt) && debt.currentBalance > 0 && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePaid(debt)}
                            className="flex-1 h-7 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Button>
                          {debt.interestRate && debt.interestRate > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickPush(debt)}
                              className="flex-1 h-7 text-xs"
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Push
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Item>
                );
              })}
            </div>
          )}

          {filteredAndSortedDebts.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredAndSortedDebts.map((debt, index) => {
                const progress = calculateProgress(debt);
                const payoffMonths = calculatePayoffMonths(debt);
                return (
                  <Card key={debt.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            #{index + 1}
                          </Badge>
                          {debt.interestRate && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {debt.interestRate}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingDebt(debt);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => {
                              setDeletingDebt(debt);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm line-clamp-1">{debt.name}</h4>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Balance</span>
                          <span className="font-bold">{formatAmount(debt.currentBalance)}</span>
                        </div>
                        
                        <Progress value={progress} className="h-1.5" />
                        
                        <div className="text-xs text-muted-foreground text-center">
                          {progress.toFixed(0)}% paid
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-2.5 w-2.5" />
                            Day {debt.paymentDueDay}
                          </div>
                          <span className="font-medium">{formatAmount(debt.monthlyPaymentAmount)}</span>
                        </div>

                        {payoffMonths && (
                          <div className="text-xs text-muted-foreground">
                            {payoffMonths} months to pay off
                          </div>
                        )}

                        {debt.deadline && (
                          <div className="text-xs text-muted-foreground">
                            Due: {new Date(debt.deadline).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}

                        {isDueToday(debt) && debt.currentBalance > 0 && (
                          <div className="flex gap-1.5 pt-1">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePaid(debt)}
                              className="flex-1 h-7 text-xs"
                            >
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Paid
                            </Button>
                            {debt.interestRate && debt.interestRate > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickPush(debt)}
                                className="flex-1 h-7 text-xs"
                              >
                                <ArrowRight className="h-2.5 w-2.5 mr-1" />
                                Push
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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