"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { ChevronLeft, ChevronRight, Globe, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { DebtDetailsDialog } from "@/components/debt-details-dialog";
import { toast } from "sonner";
import type { Expense, IncomeSource, Debt, WishlistItem } from "@/types";

interface TodayViewProps {
  profileId?: string;
}



export function TodayView({ profileId }: TodayViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "summary";
  
  const [currentDate, setCurrentDate] = useState(new Date());

  
  // Edit dialog state
  const [editTransaction, setEditTransaction] = useState<{
    transaction: Expense | IncomeSource | Debt | WishlistItem;
    type: "expense" | "income" | "debt" | "wishlist";
  } | null>(null);
  
  const [viewDebt, setViewDebt] = useState<Debt | null>(null);
  
  // Update tab via URL
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };
  // Get start and end of current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).getTime();

  // Fetch profile for currency preference and user email
  const profileQuery = profileId
    ? {
        profiles: {
          $: {
            where: {
              id: profileId,
            },
          },
          user: {},
        },
      }
    : {};
  
  const { data: profileData } = db.useQuery(profileQuery as any);

  const userCurrency = (profileData as any)?.profiles?.[0]?.currency || DEFAULT_CURRENCY;
  const userEmail = (profileData as any)?.profiles?.[0]?.user?.[0]?.email;
  

  




  const { data } = db.useQuery({
    income: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    expenses: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    debts: {
      $: {
        where: {
          profile: profileId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
        order: {
          date: "desc",
        },
      },
    },
    wishlist: {
      $: {
        where: {
          profile: profileId,
          // Fetch all wishlist items regardless of date
        },
        order: {
          createdAt: "desc",
        },
      },
    },
  });

  const income = data?.income || [];
  const expenses = data?.expenses || [];
  const debts = data?.debts || [];
  const wishlist = data?.wishlist || [];

  const handleGotIt = async (item: WishlistItem) => {
    if (!profileId) return;
    
    try {
      const expenseId = id();
      const now = Date.now();
      
      await db.transact([
        // Update wishlist item with expenseId
        db.tx.wishlist[item.id].update({
          status: "got",
          gotDate: now,
          expenseId: expenseId,
        }),
        
        // Create expense for today
        db.tx.expenses[expenseId].update({
          amount: item.amount || 0,
          category: "Wishlist", 
          recipient: item.itemName,
          date: now,
          createdAt: now,
          notes: `Fulfilled wishlist item: ${item.itemName}${item.link ? `\nLink: ${item.link}` : ""}`,
          isRecurring: false,
        }).link({ profile: profileId }),
      ]);
      
      toast.success("Marked as Got & expense created! 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item");
    }
  };

  const handleUndoGotIt = async (item: WishlistItem) => {
    if (!profileId) return;
    
    if (confirm("Revert this item? This will delete the associated expense.")) {
        try {
            let expenseIdToDelete = item.expenseId;
            
            // Fallback: search in loaded expenses if ID is missing (legacy support)
            if (!expenseIdToDelete) {
                const candidate = expenses.find((e: any) => 
                    e.amount === item.amount && 
                    e.recipient === item.itemName &&
                    e.category === "Wishlist"
                );
                if (candidate) {
                    expenseIdToDelete = candidate.id;
                }
            }

            const txs: any[] = [
                // Revert wishlist item
                db.tx.wishlist[item.id].update({
                    status: "want",
                    gotDate: null,
                    expenseId: null,
                }),
            ];
            
            // Delete associated expense if found
            if (expenseIdToDelete) {
                txs.push(db.tx.expenses[expenseIdToDelete].delete());
            }
            
            await db.transact(txs);
            
            toast.info(expenseIdToDelete ? "Reverted & expense deleted" : "Reverted (Expense not found)");
        } catch (error) {
            console.error(error);
            toast.error("Failed to revert action");
        }
    }
  };

  // Calculate month totals
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthTotal = totalIncome - totalExpenses;

  // Calculate debt totals
  const totalIOwe = debts
    .filter((d: any) => d.direction === "I_OWE")
    .reduce((sum, d: any) => sum + (d.currentBalance || d.amount || 0), 0);
  const totalTheyOwe = debts
    .filter((d: any) => d.direction === "THEY_OWE_ME")
    .reduce((sum, d: any) => sum + (d.currentBalance || d.amount || 0), 0);

  // Group transactions by day
  const transactionsByDay: Record<string, { income: any[]; expenses: any[]; debts: any[]; wishlist: any[] }> = {};

  [...income, ...expenses, ...debts, ...wishlist].forEach((item) => {
    const timestamp = "date" in item && item.date ? item.date : item.createdAt ?? Date.now();
    const date = new Date(timestamp);
    const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    if (!transactionsByDay[dayKey]) {
      transactionsByDay[dayKey] = { income: [], expenses: [], debts: [], wishlist: [] };
    }

    if ("source" in item) {
      transactionsByDay[dayKey].income.push(item);
    } else if ("recipient" in item) {
      transactionsByDay[dayKey].expenses.push(item);
    } else if ("personName" in item) {
      transactionsByDay[dayKey].debts.push(item);
    } else if ("itemName" in item) {
      transactionsByDay[dayKey].wishlist.push(item);
    }
  });

  // Sort days in descending order
  const sortedDays = Object.keys(transactionsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, direction === "prev" ? month - 1 : month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="flex flex-col h-full bg-background mt-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between px-4 pb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-lg">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Sticky Header: Stats & Tabs */}
      <div className="sticky top-0 z-10 bg-background pt-2 border-b shadow-sm">
        {/* Stats Summary - Dynamic based on active tab */}
        <div className="grid grid-cols-3 gap-4 px-4 pt-2 pb-3 text-sm">
          {activeTab === "debts" ? (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">I Owe</p>
                <p className="font-semibold text-red-600">{formatCurrency(totalIOwe, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Owed to Me</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalTheyOwe, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Net Position</p>
                <p className={`font-semibold ${totalTheyOwe - totalIOwe >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totalTheyOwe - totalIOwe, userCurrency)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalIncome, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Exp.</p>
                <p className="font-semibold text-red-600">{formatCurrency(totalExpenses, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className={`font-semibold ${monthTotal >= 0 ? "text-foreground" : "text-red-600"}`}>
                  {formatCurrency(monthTotal, userCurrency)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="grid w-full grid-cols-5 p-1 h-auto">
            <TabsTrigger value="summary" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Summary</TabsTrigger>
            <TabsTrigger value="income" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Income</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Expenses</TabsTrigger>
            <TabsTrigger value="debts" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Debts</TabsTrigger>
            <TabsTrigger value="elliw" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">ELLIW</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cashflow Health Summary - shown when Summary tab is active */}
      {activeTab === "summary" && (
        <div className="p-4">
          {/* Health Indicator - Full Width */}
          <div className="space-y-4">
            <div className="flex-1">
                <p className={`text-lg font-bold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthTotal >= totalIncome * 0.2 ? "Excellent! Strong savings" :
                   monthTotal >= 0 ? "Good, but could save more" :
                   "Warning: Spending exceeds income"}
                </p>
              </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-base font-semibold text-green-600">
                  {formatCurrency(totalIncome, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-base font-semibold text-red-600">
                  {formatCurrency(totalExpenses, userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Net Cashflow</p>
                <p className={`text-base font-semibold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
              </div>
              <div className="p-3 rounded bg-accent/50">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="text-base font-semibold">
                  {totalIncome > 0 ? ((monthTotal / totalIncome) * 100).toFixed(1) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedDays.length === 0 || 
        (activeTab === "income" && income.length === 0) ||
        (activeTab === "expenses" && expenses.length === 0) ||
        (activeTab === "debts" && debts.length === 0) ||
        (activeTab === "elliw" && wishlist.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">
            {activeTab === "summary" ? "📊" :
             activeTab === "income" ? "💰" :
             activeTab === "expenses" ? "💳" :
             activeTab === "debts" ? "🤝" :
             "✨"}
          </div>
          <p className="text-lg font-medium mb-2">
            {activeTab === "summary" ? "No transactions yet" :
             activeTab === "income" ? "No income recorded" :
             activeTab === "expenses" ? "No expenses recorded" :
             activeTab === "debts" ? "No debts to track" :
             "No wishlist items yet"}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {activeTab === "summary" ? "Start tracking your money by tapping the + button below" :
             activeTab === "income" ? "Add your first income source to start tracking earnings" :
             activeTab === "expenses" ? "Track your spending by adding expenses" :
             activeTab === "debts" ? "Keep track of money you owe or are owed" :
             "Add items you're saving up for"}
          </p>
          

        </div>
      ) : (
        <div className="space-y-3 px-4 pt-4">



          {activeTab === "elliw" && (
            <div className="space-y-4">
               {/* Unified Wishlist View */}
               <div className="space-y-3">
                 {[...wishlist]
                   .sort((a, b) => {
                     // Sort by status (want first), then by date descending (newest first)
                     if (a.status !== b.status) return a.status === "want" ? -1 : 1;
                     return (b.createdAt || 0) - (a.createdAt || 0);
                   })
                   .map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${item.status === "got" ? "bg-accent/10 opacity-70" : "bg-accent/20 hover:bg-accent/40"}`}
                      onClick={() => setEditTransaction({ transaction: item as WishlistItem, type: "wishlist" })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded flex items-center justify-center text-lg ${item.status === "got" ? "bg-green-100 dark:bg-green-900/20 grayscale" : "bg-purple-100 dark:bg-purple-900/20"}`}>
                            {item.status === "got" ? "🎁" : "✨"}
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.status === "got" ? "Got it!" : "Want"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Got It Button */}
                           {item.status === "want" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGotIt(item as WishlistItem);
                              }}
                              title="Got it!"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                           ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-400/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUndoGotIt(item as WishlistItem);
                              }}
                              title="Revert (Undo Got)"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                           )}
                           
                           {/* Link Button */}
                           {item.link && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.link, "_blank");
                              }}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {item.amount && (
                            <span className={`font-semibold text-sm ${item.status === "got" ? "line-through text-muted-foreground" : ""}`}>
                              {formatCurrency(item.amount || 0, userCurrency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab !== "elliw" && sortedDays.map((dayKey) => {
            const dayData = transactionsByDay[dayKey];
            const date = new Date(dayKey);
            const dayNumber = date.getDate();
            const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
            
            const dayIncome = dayData.income.reduce((sum, i) => sum + (i.amount || 0), 0);
            const dayExpenses = dayData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            // Filter based on active tab
            const hasVisibleItems = 
              activeTab === "summary" ||
              (activeTab === "income" && dayData.income.length > 0) ||
              (activeTab === "expenses" && dayData.expenses.length > 0) ||
              (activeTab === "debts" && dayData.debts.length > 0) ||
              (activeTab === "elliw" && dayData.wishlist.length > 0);

            if (!hasVisibleItems) return null;

            return (
              <div key={dayKey}>
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{dayNumber}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {weekday}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {dayIncome > 0 && (activeTab === "summary" || activeTab === "income") && (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(dayIncome, userCurrency)}
                      </span>
                    )}
                    {dayExpenses > 0 && (activeTab === "summary" || activeTab === "expenses") && (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(dayExpenses, userCurrency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Transactions */}
                <div className="space-y-2 ml-2">
                  {(activeTab === "summary" || activeTab === "income") && dayData.income.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => setEditTransaction({ transaction: item as IncomeSource, type: "income" })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-xs">
                            💰
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.source}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.isRecurring ? `Recurring (${item.frequency})` : "Other"}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.amount || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "expenses") && dayData.expenses.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => setEditTransaction({ transaction: item as Expense, type: "expense" })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-xs">
                            {item.category?.toLowerCase().includes("food") ? "🍔" : "💳"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.recipient}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(item.amount || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "debts") && dayData.debts.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => setViewDebt(item as Debt)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs">
                            🤝
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.personName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.direction === "I_OWE" ? "Debt" : "Loan"}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${
                          item.direction === "I_OWE" ? "text-red-600" : "text-green-600"
                        }`}>
                          {formatCurrency(item.currentBalance || 0, userCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(activeTab === "summary" || activeTab === "elliw") && dayData.wishlist.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                      onClick={() => setEditTransaction({ transaction: item as WishlistItem, type: "wishlist" })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-xs">
                            ✨
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.status === "got" ? "Got it!" : "Want"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.link && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.link, "_blank");
                              }}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                          {item.amount && (
                            <span className="font-semibold">
                              {formatCurrency(item.amount || 0, userCurrency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Edit Transaction Dialog */}
      {editTransaction && (
        <EditTransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction.transaction}
          type={editTransaction.type}
          profileId={profileId}
        />
      )}
      
      {viewDebt && (
        <DebtDetailsDialog
          debt={viewDebt}
          open={!!viewDebt}
          onOpenChange={(open) => !open && setViewDebt(null)}
          profileId={profileId}
        />
      )}
    </div>)
    }



