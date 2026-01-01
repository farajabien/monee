"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSheet } from "@/components/add-sheet";
import { Card } from "@/components/ui/card";
import { TodayView } from "@/components/today-view";
import { MonthlyView } from "@/components/monthly-view";
import { StatsView } from "@/components/stats-view";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import type { Expense, IncomeSource, Debt, WishlistItem } from "@/types";

// Income List Component
function IncomeList({ profileId, currency, onEdit }: { profileId?: string; currency: string; onEdit: (item: IncomeSource) => void }) {
  const userCurrency = currency;

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).getTime();

  const { data } = db.useQuery({
    income: {
      $: {
        where: {
          profile: profileId,
        },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  });

  const income = data?.income || [];
  const monthIncome = income.filter(
    (i) => i.date >= startOfMonth && i.date <= endOfMonth
  );
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const monthTotal = monthIncome.reduce((sum, i) => sum + (i.amount || 0), 0);
  const recurringIncome = income.filter((i) => i.isRecurring);
  const mrr = recurringIncome
    .filter((i) => i.frequency === "monthly")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Month Summary */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(monthTotal, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">All Time</p>
            <p className="font-semibold">
              {formatCurrency(totalIncome, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="font-semibold text-blue-600">
              {formatCurrency(mrr, userCurrency)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {income.length} {income.length === 1 ? "source" : "sources"}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {income.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No income recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {income.map((item) => (
              <Card 
                key={item.id} 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onEdit(item as IncomeSource)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.source}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.isRecurring
                        ? `Recurring (${item.frequency})`
                        : "One-time"}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(item.amount || 0, userCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Debts List Component
function DebtsList({ profileId, currency, onEdit }: { profileId?: string; currency: string; onEdit: (item: Debt) => void }) {
  const [debtTab, setDebtTab] = useState<"all" | "i_owe" | "they_owe">("all");
  const userCurrency = currency;

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).getTime();

  const { data } = db.useQuery({
    debts: {
      $: {
        where: {
          profile: profileId,
        },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  });

  const debts = data?.debts || [];
  const monthDebts = debts.filter(
    (d) => d.date && d.date >= startOfMonth && d.date <= endOfMonth
  );
  const iOwe = debts.filter(
    (d) => d.direction === "I_OWE" && d.status === "pending"
  );
  const theyOweMe = debts.filter(
    (d) => d.direction === "THEY_OWE_ME" && d.status === "pending"
  );
  const totalIOwe = iOwe.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalTheyOweMe = theyOweMe.reduce(
    (sum, d) => sum + (d.currentBalance || 0),
    0
  );

  // Filter debts based on active tab
  const filteredDebts =
    debtTab === "all" ? debts : debtTab === "i_owe" ? iOwe : theyOweMe;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Month Summary */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
              <p className="text-xs text-muted-foreground">I Owe</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(totalIOwe, userCurrency)}
              </p>
            </div>
            <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground">They Owe</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(totalTheyOweMe, userCurrency)}
              </p>
            </div>
          </div>
        </div>

        {/* Nested Tabs */}
        <Tabs
          value={debtTab}
          onValueChange={(v) => setDebtTab(v as "all" | "i_owe" | "they_owe")}
          className="px-4 pb-2"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="i_owe" className="text-xs">
              I Owe
            </TabsTrigger>
            <TabsTrigger value="they_owe" className="text-xs">
              They Owe
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {debtTab === "all" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-red-600">
                People I Owe
              </h3>
              {iOwe.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No debts to pay
                </div>
              ) : (
                <div className="space-y-2">
                  {iOwe.map((debt) => (
                    <Card 
                      key={debt.id} 
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onEdit(debt as Debt)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{debt.personName}</p>
                          {debt.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(debt.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {debt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {debt.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            -
                            {formatCurrency(
                              debt.currentBalance || 0,
                              userCurrency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            You owe
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-green-600">
                People Who Owe Me
              </h3>
              {theyOweMe.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No debts to collect
                </div>
              ) : (
                <div className="space-y-2">
                  {theyOweMe.map((debt) => (
                    <Card 
                      key={debt.id} 
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onEdit(debt as Debt)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{debt.personName}</p>
                          {debt.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(debt.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {debt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {debt.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +
                            {formatCurrency(
                              debt.currentBalance || 0,
                              userCurrency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            They owe you
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {debtTab === "i_owe" && (
          <div>
            {iOwe.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No debts to pay
              </div>
            ) : (
              <div className="space-y-2">
                {iOwe.map((debt) => (
                  <Card key={debt.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{debt.personName}</p>
                        {debt.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(debt.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {debt.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {debt.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          -
                          {formatCurrency(
                            debt.currentBalance || 0,
                            userCurrency
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">You owe</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {debtTab === "they_owe" && (
          <div>
            {theyOweMe.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No debts to collect
              </div>
            ) : (
              <div className="space-y-2">
                {theyOweMe.map((debt) => (
                  <Card key={debt.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{debt.personName}</p>
                        {debt.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(debt.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {debt.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {debt.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +
                          {formatCurrency(
                            debt.currentBalance || 0,
                            userCurrency
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          They owe you
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Expenses List Component
function ExpensesList({ profileId, currency, onEdit }: { profileId?: string; currency: string; onEdit: (item: Expense) => void }) {
  const userCurrency = currency;

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).getTime();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: {
          profile: profileId,
        },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  });

  const expenses = data?.expenses || [];
  const monthExpenses = expenses.filter(
    (e) => e.date >= startOfMonth && e.date <= endOfMonth
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const recurringExpenses = expenses.filter((e) => e.isRecurring);
  const monthlyRecurring = recurringExpenses
    .filter((e) => e.frequency === "monthly")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Month Summary */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-semibold text-red-600">
              {formatCurrency(monthTotal, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">All Time</p>
            <p className="font-semibold">
              {formatCurrency(totalExpenses, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">Recurring</p>
            <p className="font-semibold text-orange-600">
              {formatCurrency(monthlyRecurring, userCurrency)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card 
                key={expense.id} 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onEdit(expense as Expense)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{expense.recipient}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.category}
                    </p>
                    {expense.isRecurring && (
                      <p className="text-xs text-muted-foreground">
                        Recurring ({expense.frequency})
                      </p>
                    )}
                    {expense.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(expense.amount || 0, userCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wishlist List Component
function WishlistList({ profileId, currency, onEdit }: { profileId?: string; currency: string; onEdit: (item: WishlistItem) => void }) {
  const userCurrency = currency;

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).getTime();

  const { data } = db.useQuery({
    wishlist: {
      $: {
        where: {
          profile: profileId,
        },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  });

  const wishlist = data?.wishlist || [];
  const wantItems = wishlist.filter((w) => w.status === "want");
  const gotItems = wishlist.filter((w) => w.status === "got");
  const monthGotItems = gotItems.filter(
    (w) => w.gotDate && w.gotDate >= startOfMonth && w.gotDate <= endOfMonth
  );

  const wantTotal = wantItems.reduce((sum, w) => sum + (w.amount || 0), 0);
  const gotTotal = gotItems.reduce((sum, w) => sum + (w.amount || 0), 0);
  const monthGotTotal = monthGotItems.reduce(
    (sum, w) => sum + (w.amount || 0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Month Summary */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">Want</p>
            <p className="font-semibold text-purple-600">
              {formatCurrency(wantTotal, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">Got</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(gotTotal, userCurrency)}
            </p>
          </div>
          <div className="text-center p-2 rounded bg-accent/50">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-semibold text-blue-600">
              {formatCurrency(monthGotTotal, userCurrency)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {wantItems.length} want • {gotItems.length} got
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {wishlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No wishlist items yet
          </div>
        ) : (
          <div className="space-y-2">
            {wishlist.map((item) => (
              <Card 
                key={item.id} 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onEdit(item as WishlistItem)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{item.itemName}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                    <p className="text-xs mt-1">
                      {item.status === "got" ? (
                        <span className="text-green-600">✓ Got it!</span>
                      ) : (
                        <span className="text-muted-foreground">Want</span>
                      )}
                    </p>
                  </div>
                  {item.amount && (
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.amount, userCurrency)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "income";
  const viewMode = searchParams.get("view") || "daily";
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Edit transaction state
  const [editTransaction, setEditTransaction] = useState<{
    transaction: Expense | IncomeSource | Debt | WishlistItem;
    type: "expense" | "income" | "debt" | "wishlist";
  } | null>(null);

  const { data, isLoading } = db.useQuery({
    profiles: {},
  });

  const profile = data?.profiles?.[0];

  // Get today's date formatted as DD/MM
  const today = new Date();
  const todayFormatted = `${today.getDate().toString().padStart(2, "0")}/${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show Monthly view or regular tabs based on viewMode
  const showMonthlyView = viewMode === "monthly";
  const showTodayView = viewMode === "daily" || viewMode === "today";
  const showStatsView = viewMode === "stats";

  return (
    <div className="flex flex-col h-screen">
      {/* App wrapper with max-width */}
      {/* Merged Top Navigation - Daily/Monthly with Month Display */}
      <div className="border-b bg-background shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate month backward
              const newDate = new Date();
              newDate.setMonth(newDate.getMonth() - 1);
              // This would need state management - for now just placeholder
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard?view=daily")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily
            </button>

            <span className="text-base font-semibold">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>

            <button
              onClick={() => router.push("/dashboard?view=monthly")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate month forward
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto">
        {showMonthlyView ? (
          <MonthlyView profileId={profile?.id} />
        ) : showTodayView ? (
          <TodayView profileId={profile?.id} />
        ) : showStatsView ? (
          <StatsView profileId={profile?.id} />
        ) : (
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-background">
              <TabsTrigger
                value="income"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold"
              >
                Income
              </TabsTrigger>
              <TabsTrigger
                value="debts"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold"
              >
                Debts
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold"
              >
                Expenses
              </TabsTrigger>
              <TabsTrigger
                value="elliw"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold"
              >
                ELLIW
              </TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="mt-0">
              <IncomeList 
                profileId={profile?.id} 
                currency={profile?.currency || DEFAULT_CURRENCY}
                onEdit={(item) => setEditTransaction({ transaction: item, type: "income" })}
              />
            </TabsContent>

            <TabsContent value="debts" className="mt-0">
              <DebtsList 
                profileId={profile?.id} 
                currency={profile?.currency || DEFAULT_CURRENCY}
                onEdit={(item) => setEditTransaction({ transaction: item, type: "debt" })}
              />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <ExpensesList 
                profileId={profile?.id} 
                currency={profile?.currency || DEFAULT_CURRENCY}
                onEdit={(item) => setEditTransaction({ transaction: item, type: "expense" })}
              />
            </TabsContent>

            <TabsContent value="elliw" className="mt-0">
              <WishlistList 
                profileId={profile?.id} 
                currency={profile?.currency || DEFAULT_CURRENCY}
                onEdit={(item) => setEditTransaction({ transaction: item, type: "wishlist" })}
              />
            </TabsContent>
          </Tabs>
        )}
        </div>
      </div>

      {/* Bottom Navigation - Money Manager Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {/* Today Tab */}
          <button
            onClick={() => router.push("/dashboard?view=daily")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "daily" || viewMode === "today"
                ? "text-red-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">{todayFormatted}</span>
          </button>

          {/* Add Button - Centered & Primary */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-colors shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => router.push("/dashboard?view=stats")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "stats"
                ? "text-red-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Stats</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Add Sheet */}
      <AddSheet
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        profileId={profile?.id}
      />
      
      {/* Edit Transaction Dialog */}
      {editTransaction && (
        <EditTransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction.transaction}
          type={editTransaction.type}
          profileId={profile?.id}
        />
      )}
    </div>
  );
}
