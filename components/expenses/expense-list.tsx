"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { DataTable } from "@/components/ui/data-table";
import { transactionColumns } from "./transaction-columns";
import { Trash2, Edit, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DataViewControls } from "@/components/ui/data-view-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense } from "@/types";

export default function ExpenseList() {
  const user = db.useUser();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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
    expenses: {
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

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const recipients = useMemo(() => data?.recipients || [], [data?.recipients]);

  const categories = useMemo(() => {
    const cats = new Set(
      expenses.map((t: Expense) => t.category).filter(Boolean)
    );
    return Array.from(cats);
  }, [expenses]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach((t: Expense) => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const metrics = useMemo(() => {
    let filtered = [...expenses];

    if (monthFilter !== "all") {
      filtered = filtered.filter((t: Expense) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        return monthKey === monthFilter;
      });
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t: Expense) => t.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((t: Expense) => {
        const displayName = getDisplayName(t.recipient || "");
        return (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatAmount(t.amount)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });
    }

    const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = filtered.length;
    const avgTransaction =
      transactionCount > 0 ? totalSpent / transactionCount : 0;

    return {
      totalSpent,
      transactionCount,
      avgTransaction,
    };
  }, [expenses, monthFilter, categoryFilter, searchQuery]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...expenses];

    if (monthFilter !== "all") {
      result = result.filter((t: Expense) => {
        const date = new Date(t.date || t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        return monthKey === monthFilter;
      });
    }

    if (searchQuery) {
      result = result.filter((t: Expense) => {
        const displayName = getDisplayName(t.recipient || "");
        return (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatAmount(t.amount)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });
    }

    if (categoryFilter !== "all") {
      result = result.filter((t: Expense) => t.category === categoryFilter);
    }

    result.sort((a: Expense, b: Expense) => {
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
  }, [expenses, searchQuery, categoryFilter, sortBy, monthFilter]);

  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r) => r.originalName === originalName);
    return recipient?.nickname || originalName;
  };

  const deleteExpense = (expenseId: string) => {
    db.transact(db.tx.expenses[expenseId].delete());
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
    const [year, month] = monthKey.split("-");
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
          <div className="font-semibold text-base">Expenses</div>
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
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            filterLabel="Category"
            totalCount={expenses.length}
            filteredCount={filteredAndSortedTransactions.length}
          />

          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              {searchQuery ||
              categoryFilter !== "all" ||
              monthFilter !== "all" ? (
                <p className="text-sm">
                  No expenses found matching your filters
                </p>
              ) : (
                <>
                  <p className="text-sm mb-1">No expenses yet</p>
                  <p className="text-xs">Add your first Mpesa message above</p>
                </>
              )}
            </div>
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "list" && (
            <DataTable
              columns={transactionColumns}
              data={filteredAndSortedTransactions}
              onEdit={(expense) => {
                setEditingExpense(expense);
                setIsEditDialogOpen(true);
              }}
              onDelete={deleteExpense}
            />
          )}

          {filteredAndSortedTransactions.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredAndSortedTransactions.map(
                (expense: Expense, index: number) => (
                  <Item
                    key={expense.id}
                    className="flex flex-col gap-2 p-3"
                    variant="outline"
                    size="sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        #{index + 1}
                      </Badge>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-base">
                          {formatAmount(expense.amount)}
                        </span>
                        {expense.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {expense.category}
                          </Badge>
                        )}
                      </div>

                      {expense.recipient && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          To: {getDisplayName(expense.recipient)}
                        </p>
                      )}

                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(expense.date || expense.createdAt)}
                      </p>
                    </div>
                  </Item>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <EditExpenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        expense={editingExpense}
      />
    </div>
  );
}
