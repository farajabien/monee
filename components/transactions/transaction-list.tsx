"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { Trash2, Edit, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction } from "@/types";

export default function TransactionList() {
  const user = db.useUser();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };;
  
  const { data } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
        limit: 50,
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const transactions = data?.transactions || [];
  const recipients = data?.recipients || [];
  
  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t: Transaction) => t.category).filter(Boolean));
    return Array.from(cats);
  }, [transactions]);

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t: Transaction) => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse(); // Most recent first
  }, [transactions]);

  // Calculate metrics for filtered transactions
  const metrics = useMemo(() => {
    let filtered = [...transactions];

    // Apply month filter first
    if (monthFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => t.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((t: Transaction) => {
        const displayName = getDisplayName(t.recipient || "");
        return (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatAmount(t.amount).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = filtered.length;
    const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    return {
      totalSpent,
      transactionCount,
      avgTransaction,
    };
  }, [transactions, monthFilter, categoryFilter, searchQuery]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Month filter
    if (monthFilter !== "all") {
      result = result.filter((t: Transaction) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

    // Search filter
    if (searchQuery) {
      result = result.filter((t: Transaction) => {
        const displayName = getDisplayName(t.recipient || "");
        return (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatAmount(t.amount).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((t: Transaction) => t.category === categoryFilter);
    }

    // Sort
    result.sort((a: Transaction, b: Transaction) => {
      switch (sortBy) {
        case "newest":
          return (b.date || b.createdAt) - (a.date || a.createdAt);
        case "oldest":
          return (a.date || a.createdAt) - (b.date || b.createdAt);
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        default:
          return (b.date || b.createdAt) - (a.date || a.createdAt);
      }
    });

    return result;
  }, [transactions, searchQuery, categoryFilter, sortBy]);

  // Helper to get display name (nickname or original)
  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r: any) => r.originalName === originalName);
    return recipient?.nickname || originalName;
  };

  const deleteTransaction = (transactionId: string) => {
    db.transact(db.tx.transactions[transactionId].delete());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  };

  // Format number to compact form (1000 -> 1K, 1000000 -> 1M)
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      {/* Metrics Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="text-sm px-3 py-1.5">
          <DollarSign className="h-3.5 w-3.5 mr-1.5" />
          Ksh {formatCompact(metrics.totalSpent)} Spent
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          {metrics.transactionCount} Transactions
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
          Avg: Ksh {formatCompact(metrics.avgTransaction)}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          {/* Month Filter */}
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataViewControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search transactions..."
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
              { value: "amount-high", label: "Amount: High to Low" },
              { value: "amount-low", label: "Amount: Low to High" },
            ]}
            filterValue={categoryFilter}
            onFilterChange={setCategoryFilter}
            filterOptions={[
              { value: "all", label: "All Categories" },
              ...categories.map(cat => ({ value: cat, label: cat })),
            ]}
            filterLabel="Category"
            totalCount={transactions.length}
            filteredCount={filteredAndSortedTransactions.length}
          />

          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery || categoryFilter !== "all" ? (
                <p>No transactions found matching your filters.</p>
              ) : (
                <p>No transactions yet. Add your first Mpesa message above!</p>
              )}
            </div>
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "list" && (
            <div className="space-y-2">
              {filteredAndSortedTransactions.map((transaction: Transaction, index: number) => (
                <Item key={transaction.id} variant="outline">
                  <Badge variant="outline" className="text-xs shrink-0">#{index + 1}</Badge>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {formatAmount(transaction.amount)}
                      </span>
                      {transaction.category && (
                        <Badge variant="secondary">{transaction.category}</Badge>
                      )}
                    </div>
                    {transaction.recipient && (
                      <p className="text-sm text-muted-foreground">
                        To: {getDisplayName(transaction.recipient)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.date || transaction.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Item>
              ))}
            </div>
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedTransactions.map((transaction: Transaction, index: number) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">
                        {formatAmount(transaction.amount)}
                      </div>
                      {transaction.category && (
                        <Badge variant="secondary">{transaction.category}</Badge>
                      )}
                      {transaction.recipient && (
                        <p className="text-sm text-muted-foreground">
                          To: {getDisplayName(transaction.recipient)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={editingTransaction}
      />
    </>
  );
}

