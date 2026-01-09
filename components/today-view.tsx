"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { ChevronLeft, ChevronRight, Globe, CheckCircle, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { DebtDetailsDialog } from "@/components/debt-details-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ArrowUpDown, Filter } from "lucide-react";
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

  // Filters State
  const [wishlistFilter, setWishlistFilter] = useState<"pending" | "got" | "all">("pending");
  const [debtFilter, setDebtFilter] = useState<"pending" | "paid" | "all">("pending");
  const [debtDirectionFilter, setDebtDirectionFilter] = useState<"all" | "I_OWE" | "THEY_OWE_ME">("all");
  const [debtYearFilter, setDebtYearFilter] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // Helper to check if item matches search query
  const matchesSearch = (item: any, type: "income" | "expense" | "debt" | "wishlist") => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (type === "income") return (item as IncomeSource).source.toLowerCase().includes(query);
    if (type === "expense") {
       const exp = item as Expense;
       return (exp.recipient?.toLowerCase().includes(query) || false) || (exp.category && exp.category.toLowerCase().includes(query)) || false;
    }
    if (type === "debt") return (item as Debt).personName?.toLowerCase().includes(query);
    if (type === "wishlist") return (item as WishlistItem).itemName.toLowerCase().includes(query);
    
    return false;
  };

  // Filter all lists based on search query
  const filteredIncome = income.filter(i => matchesSearch(i, "income"));
  const filteredExpenses = expenses.filter(e => matchesSearch(e, "expense"));
  
  // Debt Filtering Logic
  const allFilteredDebts = debts.filter(d => matchesSearch(d, "debt"));
  
  // Extract available years from debts
  const debtYears = Array.from(new Set(allFilteredDebts.map(d => {
      const date = new Date(d.date || d.createdAt || Date.now());
      return date.getFullYear().toString();
  }))).sort((a, b) => b.localeCompare(a));

  const filteredDebts = allFilteredDebts.filter(d => {
      // 1. Status Filter
      if (debtFilter !== "all") {
          const isPaid = d.isPaidOff || (d.currentBalance || 0) <= 0;
          if (debtFilter === "pending" && isPaid) return false;
          if (debtFilter === "paid" && !isPaid) return false;
      }
      
      // 2. Direction Filter
      if (debtDirectionFilter !== "all") {
          if (d.direction !== debtDirectionFilter) return false;
      }
      
      // 3. Year Filter
      if (debtYearFilter !== "all") {
          const year = new Date(d.date || d.createdAt || Date.now()).getFullYear().toString();
          if (year !== debtYearFilter) return false;
      }
      
      return true;
  }).sort((a, b) => {
       if (sortOption === "amount-desc") return (b.currentBalance || 0) - (a.currentBalance || 0);
       if (sortOption === "amount-asc") return (a.currentBalance || 0) - (b.currentBalance || 0);
       
       const dateA = a.date || a.createdAt || 0;
       const dateB = b.date || b.createdAt || 0;
       
       if (sortOption === "date-asc") return dateA - dateB;
       return dateB - dateA;
  });

  // Group Debts by Month
  const debtsByMonth: Record<string, any[]> = {};
  filteredDebts.forEach(debt => {
      const date = new Date(debt.date || debt.createdAt || Date.now());
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`; // Unique Month Key
      if (!debtsByMonth[monthKey]) debtsByMonth[monthKey] = [];
      debtsByMonth[monthKey].push(debt);
  });
  
  // Sort months based on sort option (desc/asc)
  const sortedDebtMonths = Object.keys(debtsByMonth).sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);
      
      // Construct approximate dates for comparison
      const dateA = new Date(yearA, monthA, 1).getTime();
      const dateB = new Date(yearB, monthB, 1).getTime();
      
      return sortOption === "date-asc" ? dateA - dateB : dateB - dateA;
  });

  // Filter Wishlist
  const filteredWishlist = wishlist
    .filter(item => {
      // 1. Status Filter
      if (wishlistFilter !== "all") {
          if (wishlistFilter === "got" && item.status !== "got") return false;
          if (wishlistFilter === "pending" && item.status !== "want") return false;
      }
      // 2. Search Query
      return matchesSearch(item, "wishlist");
    })
    .sort((a, b) => {
       // 1. Sort by selected option
       if (sortOption === "amount-desc") return (b.amount || 0) - (a.amount || 0);
       if (sortOption === "amount-asc") return (a.amount || 0) - (b.amount || 0);
       
       const dateA = a.status === "got" ? (a.gotDate || 0) : (a.createdAt || 0);
       const dateB = b.status === "got" ? (b.gotDate || 0) : (b.createdAt || 0);
       
       if (sortOption === "date-asc") return dateA - dateB;
       return dateB - dateA;
    });

  const wishlistTotal = filteredWishlist.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Calculate month totals (Using Filtered Data)
  const totalIncome = filteredIncome.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthTotal = totalIncome - totalExpenses;

  // Calculate debt totals (Total Outstanding across ALL fetched debts for correct summary)
  const totalIOwe = debts // Use 'debts' raw list for "Total I Owe" globally
    .filter((d: any) => d.direction === "I_OWE")
    .reduce((sum, d: any) => sum + (d.currentBalance || d.amount || 0), 0);
  const totalTheyOwe = debts
    .filter((d: any) => d.direction === "THEY_OWE_ME")
    .reduce((sum, d: any) => sum + (d.currentBalance || d.amount || 0), 0);
  
  // For the Stats Header when in 'debts' tab, maybe show filtered total?
  const visibleDebtTotal = filteredDebts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);

  const isDateSort = sortOption.includes("date");
  
  // Prepare Flat List for Amount Sort
  const getFlatList = () => {
      let items: any[] = [];
      if (activeTab === "summary") {
          // For summary, we might want to stick to monthly view logic or bring back the old logic?
          // The prompt requested debts to be always visible. 
          // Summary tab usually shows THIS MONTH's overview. 
          // Mixing global debts into "Today View" summary might be confusing if they aren't dated this month.
          // Let's keep Summary tab focused on 'income' and 'expenses' of THIS MONTH + 'debts' of THIS MONTH (if any created).
          // OR, since we changed the query, 'debts' now has ALL debts. 
          // We should filter 'debts' back to 'this month' for the Summary tab to match the month navigation.
          
          const thisMonthDebts = debts.filter(d => {
             const dDate = new Date(d.date || d.createdAt || 0);
             return dDate >= new Date(startOfMonth) && dDate <= new Date(endOfMonth);
          });
          
          items = [...filteredIncome, ...filteredExpenses, ...thisMonthDebts]; // Only show debts from this month in summary?
          // Actually, let's keep it simple. Summary shows cashflow. Debts created this month affect cashflow if they are loans? 
          // Let's stick to previous behavior for Summary: Items dated in this month.
          
      } else if (activeTab === "income") items = [...filteredIncome];
      else if (activeTab === "expenses") items = [...filteredExpenses];
      else if (activeTab === "debts") items = [...filteredDebts];
      
      return items.sort((a, b) => {
          const valA = a.currentBalance ?? a.amount ?? 0;
          const valB = b.currentBalance ?? b.amount ?? 0;
          return sortOption === "amount-desc" ? valB - valA : valA - valB;
      });
  };

  const flatSortedItems = !isDateSort ? getFlatList() : [];

  // Group transactions by day (ONLY if Date Sort)
  const transactionsByDay: Record<string, { income: any[]; expenses: any[]; debts: any[]; wishlist: any[] }> = {};
  
  if (isDateSort) {
      // For Summary/Income/Expenses, we interact with "This Month" data mainly
      const monthDebts = debts.filter(d => {
             const dDate = new Date(d.date || d.createdAt || 0);
             return dDate >= new Date(startOfMonth) && dDate <= new Date(endOfMonth);
      });
      // Filter based on search query too for consistency in summary
      const filteredMonthDebts = monthDebts.filter(d => matchesSearch(d, "debt"));

      [...filteredIncome, ...filteredExpenses, ...filteredMonthDebts].forEach((item) => {
        const timestamp = "date" in item && item.date ? item.date : item.createdAt ?? Date.now();
        const date = new Date(timestamp);
        const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
        
        if (!transactionsByDay[dayKey]) {
          transactionsByDay[dayKey] = { income: [], expenses: [], debts: [], wishlist: [] };
        }

        if ("source" in item) transactionsByDay[dayKey].income.push(item);
        else if ("recipient" in item) transactionsByDay[dayKey].expenses.push(item);
        else if ("personName" in item) transactionsByDay[dayKey].debts.push(item);
        // Wishlist is handled separately now
      });
  }

  // Sort days
  const sortedDays = Object.keys(transactionsByDay).sort((a, b) => {
      const timeA = new Date(a).getTime();
      const timeB = new Date(b).getTime();
      return sortOption === "date-asc" ? timeA - timeB : timeB - timeA;
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, direction === "prev" ? month - 1 : month + 1, 1));
  };
  
  // Render Logic for Debts Tab
  if (activeTab === "debts") {
      // We will render this in the return block
  }
  const monthName = currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky Header: Stats & Tabs - Sticks below the main nav */}
      <div className="sticky top-0 z-40 bg-background pt-2 border-b shadow-sm">
        {/* Stats Summary - Dynamic based on active tab */}
        <div className="grid grid-cols-3 gap-4 px-4 pt-2 pb-3 text-sm">
          {activeTab === "debts" ? (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">I Owe</p>
                <p className="font-semibold text-red-600 text-base">{formatCurrency(totalIOwe, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Owed to Me</p>
                <p className="font-semibold text-green-600 text-base">{formatCurrency(totalTheyOwe, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Showing</p>
                <p className="font-semibold text-base">{filteredDebts.length}</p>
              </div>
            </>
          ) : activeTab === "elliw" ? (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="font-semibold text-base">{filteredWishlist.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Filter</p>
                <p className="font-semibold capitalize text-purple-600 text-base">{wishlistFilter}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Worth</p>
                <p className="font-semibold text-purple-600 text-base">
                  {formatCurrency(wishlistTotal, userCurrency)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="font-semibold text-green-600 text-base">{formatCurrency(totalIncome, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Expense</p>
                <p className="font-semibold text-red-600 text-base">{formatCurrency(totalExpenses, userCurrency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Left Over</p>
                <p className={`font-semibold text-base ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(monthTotal, userCurrency)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* View Selector - Dropdown Based */}
        <div className="px-4 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-10 font-semibold">
                <span>
                  {activeTab === "summary" && "📊 Overview"}
                  {activeTab === "income" && "💰 Income"}
                  {activeTab === "expenses" && "💳 Expense"}
                  {activeTab === "debts" && "🤝 Debts & Loans"}
                  {activeTab === "elliw" && "✨ Wishlist"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-md" align="center">
              <DropdownMenuItem onClick={() => setActiveTab("summary")} className="cursor-pointer py-3">
                <span className="mr-2">📊</span>
                <div>
                  <div className="font-medium">Overview</div>
                  <div className="text-xs text-muted-foreground">See where your money went</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("expenses")} className="cursor-pointer py-3">
                <span className="mr-2">💳</span>
                <div>
                  <div className="font-medium">Expense</div>
                  <div className="text-xs text-muted-foreground">Track what you spent</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("income")} className="cursor-pointer py-3">
                <span className="mr-2">💰</span>
                <div>
                  <div className="font-medium">Income</div>
                  <div className="text-xs text-muted-foreground">Track your earnings</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("debts")} className="cursor-pointer py-3">
                <span className="mr-2">🤝</span>
                <div>
                  <div className="font-medium">Debts & Loans</div>
                  <div className="text-xs text-muted-foreground">Money you owe or are owed</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("elliw")} className="cursor-pointer py-3">
                <span className="mr-2">✨</span>
                <div>
                  <div className="font-medium">Wishlist</div>
                  <div className="text-xs text-muted-foreground">Things you're saving for</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter & Sort Bar */}
        <div className="px-4 pb-3 flex gap-2">
           <div className="relative flex-1">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 h-9"
             />
           </div>
           
           <Select value={sortOption} onValueChange={(val: any) => setSortOption(val)}>
             <SelectTrigger className="w-[110px] h-9">
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="date-desc">Newest</SelectItem>
               <SelectItem value="date-asc">Oldest</SelectItem>
               <SelectItem value="amount-desc">Price ⬇</SelectItem>
               <SelectItem value="amount-asc">Price ⬆</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </div>

      {/* Cashflow Health Summary - shown when Summary tab is active */}
      {activeTab === "summary" && (
        <div className="p-4">
          {/* Health Indicator - Full Width */}
          <div className="space-y-4">
            <div className="flex-1">
                <p className={`text-2xl font-bold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {monthTotal >= totalIncome * 0.2 ? "Strong savings this month" :
                   monthTotal >= 0 ? "You're staying positive" :
                   "Spending more than earning"}
                </p>
              </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground mb-1">Income</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(totalIncome, userCurrency)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground mb-1">Expense</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(totalExpenses, userCurrency)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground mb-1">Left Over</p>
                <p className={`text-lg font-semibold ${monthTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {monthTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(monthTotal), userCurrency)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground mb-1">Saved</p>
                <p className="text-lg font-semibold">
                  {totalIncome > 0 ? ((monthTotal / totalIncome) * 100).toFixed(1) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Filters - Always Block */}
      {activeTab === "elliw" && (
        <div className="px-4 pt-4 pb-2">
            <div className="flex gap-2">
                <Button 
                size="sm" 
                variant={wishlistFilter === "pending" ? "default" : "outline"}
                onClick={() => setWishlistFilter("pending")}
                className="h-7 text-xs"
                >
                Pending
                </Button>
                <Button 
                size="sm" 
                variant={wishlistFilter === "got" ? "default" : "outline"}
                onClick={() => setWishlistFilter("got")}
                className="h-7 text-xs"
                >
                Got
                </Button>
                <Button 
                size="sm" 
                variant={wishlistFilter === "all" ? "default" : "outline"}
                onClick={() => setWishlistFilter("all")}
                className="h-7 text-xs"
                >
                All
                </Button>
            </div>
        </div>
      )}

      {/* Debt Filters - Always Block */}
      {activeTab === "debts" && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant={debtFilter === "pending" ? "default" : "outline"}
                        onClick={() => setDebtFilter("pending")}
                        className="h-7 text-xs"
                    >
                        Pending
                    </Button>
                    <Button 
                        size="sm" 
                        variant={debtFilter === "paid" ? "default" : "outline"}
                        onClick={() => setDebtFilter("paid")}
                        className="h-7 text-xs"
                    >
                        Paid
                    </Button>
                    <Button 
                        size="sm" 
                        variant={debtFilter === "all" ? "default" : "outline"}
                        onClick={() => setDebtFilter("all")}
                        className="h-7 text-xs"
                    >
                        All
                    </Button>
                </div>
                
                {/* Year Filter (only if multiple years) */}
                {debtYears.length > 1 && (
                        <Select value={debtYearFilter} onValueChange={setDebtYearFilter}>
                        <SelectTrigger className="h-7 text-xs w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {debtYears.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                )}
            </div>
          </div>
      )}

      {(activeTab === "elliw" ? filteredWishlist.length === 0 : (isDateSort ? sortedDays.length === 0 : flatSortedItems.length === 0)) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">
            {activeTab === "summary" ? "📊" :
             activeTab === "income" ? "💰" :
             activeTab === "expenses" ? "💳" :
             activeTab === "debts" ? "🤝" :
             "✨"}
          </div>
          <p className="text-lg font-medium mb-2">
            {activeTab === "summary" ? "Nothing here yet" :
             activeTab === "income" ? "No money in" :
             activeTab === "expenses" ? "No money out" :
             activeTab === "debts" ? "No debts tracked" :
             "Nothing on your wishlist"}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {searchQuery ? "Try a different search" :
             (activeTab === "summary" ? "Tap the + button below to start tracking" :
             activeTab === "income" ? "Add your salary, freelance pay, or other earnings" :
             activeTab === "expenses" ? "Track where your money goes" :
             activeTab === "debts" ? "Keep track of money you owe or are owed" :
             "Add things you're saving up for")}
          </p>

        </div>
      ) : (
        <div className="space-y-3 px-4 pt-4">

          {activeTab === "elliw" && (
            <div className="space-y-4">
               {/* Unified Wishlist View */}

               {/* Unified Wishlist View */}
               <div className="space-y-3">
                 {filteredWishlist.map((item) => (
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">
                                {item.status === "got" ? "Got it!" : "Want"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  (item.status === "got" && item.gotDate) ? item.gotDate : (item.createdAt || Date.now())
                                ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
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

          {activeTab === "debts" && (
             <div className="space-y-4">
               {/* Debts List Grouped by Month */}
               {filteredDebts.length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground">
                       <p>No debts found.</p>
                   </div>
               ) : (
                   <div className="space-y-6">
                       {sortedDebtMonths.map(monthKey => {
                           const [y, m] = monthKey.split("-").map(Number);
                           const monthDate = new Date(y, m, 1);
                           const groupDebts = debtsByMonth[monthKey];
                           const totalGroup = groupDebts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);

                           return (
                               <div key={monthKey}>
                                   <div className="flex items-center justify-between mb-2">
                                       <h3 className="font-semibold text-lg">
                                           {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                       </h3>
                                       <span className="text-xs font-mono text-muted-foreground">
                                           {formatCurrency(totalGroup, userCurrency)}
                                       </span>
                                   </div>
                                   <div className="space-y-2">
                                       {groupDebts.map(item => (
                                           <div 
                                               key={item.id} 
                                               className={`p-3 rounded-lg cursor-pointer transition-colors ${item.isPaidOff ? "bg-accent/10 opacity-70" : "bg-accent/20 hover:bg-accent/40"}`}
                                               onClick={() => {
                                                   setViewDebt(item as Debt);
                                                   setEditTransaction({ transaction: item, type: "debt" });
                                               }}
                                           >
                                               <div className="flex items-center justify-between">
                                                   <div className="flex items-center gap-3">
                                                       <div className={`w-10 h-10 rounded flex items-center justify-center text-lg ${item.direction === "I_OWE" ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20"}`}>
                                                           🤝
                                                       </div>
                                                       <div>
                                                           <p className="font-medium text-sm">{item.personName}</p>
                                                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                               <span className="font-mono">
                                                                   {item.direction === "I_OWE" ? "I Owe" : "Owed to Me"}
                                                               </span>
                                                               <span>•</span>
                                                               <span>{new Date(item.date || item.createdAt).toLocaleDateString()}</span>
                                                               {item.isPaidOff && <span className="text-green-600 font-bold">• Paid</span>}
                                                           </div>
                                                       </div>
                                                   </div>
                                                   <span className={`font-semibold ${item.direction === "I_OWE" ? "text-red-600" : "text-green-600"}`}>
                                                       {formatCurrency(item.currentBalance || 0, userCurrency)}
                                                   </span>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               )}
             </div>
          )}

          {activeTab !== "elliw" && activeTab !== "debts" && (
            isDateSort ? (
              // grouped by Day View (Date Sort)
              sortedDays.map((dayKey) => {
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
                  (activeTab === "debts" && dayData.debts.length > 0);

                if (!hasVisibleItems) return null;

                return (
                  <div key={dayKey}>
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-2 mt-4">
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
                         // ... Income Item Component ...
                        <div
                          key={item.id}
                          className="p-4 bg-accent/20 rounded-xl cursor-pointer hover:bg-accent/40 transition-all active:scale-[0.98] min-h-[68px]"
                          onClick={() => setEditTransaction({ transaction: item as IncomeSource, type: "income" })}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-lg">
                                💰
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.source}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.isRecurring ? `Recurring (${item.frequency})` : "One-time"}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-base text-green-600">
                              {formatCurrency(item.amount || 0, userCurrency)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {(activeTab === "summary" || activeTab === "expenses") && dayData.expenses.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-accent/20 rounded-xl cursor-pointer hover:bg-accent/40 transition-all active:scale-[0.98] min-h-[68px]"
                          onClick={() => setEditTransaction({ transaction: item as Expense, type: "expense" })}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-lg">
                                {item.category?.toLowerCase().includes("food") ? "🍔" : "💳"}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.recipient}</p>
                                <p className="text-xs text-muted-foreground">{item.category || "Other"}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-base text-red-600">
                              {formatCurrency(item.amount || 0, userCurrency)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Debts are now handled in their own dedicated view above */}
                    </div>
                  </div>
                );
              })
            ) : (
             // Flat List View (Amount Sort)
             <div className="space-y-2">
                 {flatSortedItems.map((item) => {
                     let type: "income" | "expense" | "debt" = "expense";
                     if ("source" in item) type = "income";
                     else if ("personName" in item) type = "debt";
                     
                     return (
                         <div 
                           key={item.id} 
                           className="p-3 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors"
                           onClick={() => {
                               if (type === "debt") setViewDebt(item as Debt);
                               else setEditTransaction({ transaction: item, type: type as any });
                           }}
                         >
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                                   type === "income" ? "bg-green-100 dark:bg-green-900/20" : 
                                   type === "debt" ? "bg-blue-100 dark:bg-blue-900/20" : "bg-red-100 dark:bg-red-900/20"
                               }`}>
                                 {type === "income" ? "💰" : type === "debt" ? "🤝" : (item.category?.toLowerCase().includes("food") ? "🍔" : "💳")}
                               </div>
                               <div>
                                 <p className="font-medium text-sm">
                                     {type === "income" ? (item as IncomeSource).source : 
                                      type === "debt" ? (item as Debt).personName : (item as Expense).recipient}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                    {new Date(item.date || item.createdAt || 0).toLocaleDateString()}
                                    {type !== "debt" && ` • ${type === "income" ? (item.frequency || "One-time") : item.category}`}
                                 </p>
                               </div>
                             </div>
                             <span className={`font-semibold ${
                                 type === "income" || (type === "debt" && (item as Debt).direction !== "I_OWE") ? "text-green-600" : "text-red-600"
                             }`}>
                               {formatCurrency(item.currentBalance ?? item.amount ?? 0, userCurrency)}
                             </span>
                           </div>
                         </div>
                     );
                 })}
             </div>
            )
          )}
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



