"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { DataTable } from "@/components/ui/data-table";
import { transactionColumns } from "./transaction-columns";
import { Trash2, Edit, TrendingUp, Calendar, DollarSign } from "lucide-react";
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
  };
  
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

  const transactions = useMemo(() => data?.transactions || [], [data?.transactions]);
  const recipients = useMemo(() => data?.recipients || [], [data?.recipients]);
  
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t: Transaction) => t.category).filter(Boolean));
    return Array.from(cats);
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t: Transaction) => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const metrics = useMemo(() => {
    let filtered = [...transactions];

    if (monthFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => t.category === categoryFilter);
    }

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

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (monthFilter !== "all") {
      result = result.filter((t: Transaction) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

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

    if (categoryFilter !== "all") {
      result = result.filter((t: Transaction) => t.category === categoryFilter);
    }

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
  }, [transactions, searchQuery, categoryFilter, sortBy, monthFilter]);

  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r) => r.originalName === originalName);
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

  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-3">
      {/* Metrics */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          <DollarSign className="h-3 w-3 mr-1" />
          Ksh {formatCompact(metrics.totalSpent)}
        </Badge>
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          <Calendar className="h-3 w-3 mr-1" />
          {metrics.transactionCount} Trans
        </Badge>
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          <TrendingUp className="h-3 w-3 mr-1" />
          Avg: Ksh {formatCompact(metrics.avgTransaction)}
        </Badge>
      </div>

      <div className="border rounded-lg bg-background p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-base">Transactions</div>
          {availableMonths.length > 0 && (
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month} className="text-xs">
                    {formatMonthLabel(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <DataViewControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search..."
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "amount-high", label: "Amount ↓" },
              { value: "amount-low", label: "Amount ↑" },
            ]}
            filterValue={categoryFilter}
            onFilterChange={setCategoryFilter}
            filterOptions={[
              { value: "all", label: "All" },
              ...categories.map(cat => ({ value: cat, label: cat })),
            ]}
            filterLabel="Category"
            totalCount={transactions.length}
            filteredCount={filteredAndSortedTransactions.length}
          />

          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              {searchQuery || categoryFilter !== "all" || monthFilter !== "all" ? (
                <p className="text-sm">No transactions found matching your filters</p>
              ) : (
                <>
                  <p className="text-sm mb-1">No transactions yet</p>
                  <p className="text-xs">Add your first Mpesa message above</p>
                </>
              )}
            </div>
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "list" && (
            <DataTable
              columns={transactionColumns}
              data={filteredAndSortedTransactions}
              onEdit={(transaction) => {
                setEditingTransaction(transaction);
                setIsEditDialogOpen(true);
              }}
              onDelete={deleteTransaction}
            />
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredAndSortedTransactions.map((transaction: Transaction, index: number) => (
                <Item key={transaction.id} className="flex flex-col gap-2 p-3" variant="outline" size="sm">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
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
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-base">
                        {formatAmount(transaction.amount)}
                      </span>
                      {transaction.category && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {transaction.category}
                        </Badge>
                      )}
                    </div>

                    {transaction.recipient && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        To: {getDisplayName(transaction.recipient)}
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(transaction.date || transaction.createdAt)}
                    </p>
                  </div>
                </Item>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={editingTransaction}
      />
    </div>
  );
}