"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/components/ui/item";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { IncomeSourceForm } from "./income-source-form";
import type { IncomeSourceWithUser } from "@/types";

export function IncomeSourceList() {
  const user = db.useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] =
    useState<IncomeSourceWithUser | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount-high");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };

  const { data } = db.useQuery({
    income_sources: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const incomeSources: IncomeSourceWithUser[] = data?.income_sources || [];

  // Filter and sort income sources
  const filteredAndSortedSources = useMemo(() => {
    let result = [...incomeSources];

    // Search filter
    if (searchQuery) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => {
        if (statusFilter === "active") return s.isActive !== false;
        if (statusFilter === "inactive") return s.isActive === false;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "name":
          return a.name.localeCompare(b.name);
        case "payday":
          return a.paydayDay - b.paydayDay;
        default:
          return b.amount - a.amount;
      }
    });

    return result;
  }, [incomeSources, searchQuery, statusFilter, sortBy]);

  // Metrics for badges
  const metrics = useMemo(() => {
    const active = incomeSources.filter((s) => s.isActive !== false);
    const inactive = incomeSources.filter((s) => s.isActive === false);
    const total = incomeSources.length;
    const totalAmount = active.reduce((sum, s) => sum + s.amount, 0);
    return {
      activeCount: active.length,
      inactiveCount: inactive.length,
      totalCount: total,
      totalAmount,
    };
  }, [incomeSources]);

  const handleDelete = (incomeSourceId: string) => {
    if (confirm("Are you sure you want to delete this income source?")) {
      db.transact(db.tx.income_sources[incomeSourceId].delete());
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPayday = (paydayDay: number, paydayMonth?: number) => {
    if (paydayMonth) {
      const monthName = new Date(2000, paydayMonth - 1).toLocaleString(
        "default",
        {
          month: "long",
        }
      );
      return `${monthName} ${paydayDay}`;
    }
    return `Day ${paydayDay} of each month`;
  };

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            {metrics.activeCount} Active
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            💰 {formatAmount(metrics.totalAmount)}
          </Badge>
          {metrics.inactiveCount > 0 && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              {metrics.inactiveCount} Inactive
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingIncomeSource(null);
              setShowDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Income
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <DataViewControls
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search income sources..."
              sortValue={sortBy}
              onSortChange={setSortBy}
              sortOptions={[
                { value: "amount-high", label: "Amount: High to Low" },
                { value: "amount-low", label: "Amount: Low to High" },
                { value: "name", label: "Name (A-Z)" },
                { value: "payday", label: "Payday" },
              ]}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={[
                { value: "all", label: "All Sources" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              filterLabel="Status"
              totalCount={incomeSources.length}
              filteredCount={filteredAndSortedSources.length}
            />
          </div>
        </div>

        {/* Dialog for add/edit income source */}
        <Dialog
          open={showDialog || !!editingIncomeSource}
          onOpenChange={(open) => {
            if (!open) {
              setShowDialog(false);
              setEditingIncomeSource(null);
            }
          }}
        >
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIncomeSource
                  ? "Edit Income Source"
                  : "Add Income Source"}
              </DialogTitle>
            </DialogHeader>
            <IncomeSourceForm
              incomeSource={editingIncomeSource}
              onSuccess={() => {
                setShowDialog(false);
                setEditingIncomeSource(null);
              }}
              onCancel={() => {
                setShowDialog(false);
                setEditingIncomeSource(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {filteredAndSortedSources.length === 0 &&
          !showDialog &&
          !editingIncomeSource && (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? (
                <p>No income sources found matching your filters.</p>
              ) : (
                <>
                  <p className="mb-2">No income sources added yet.</p>
                  <p className="text-sm">
                    Add your income sources to track your earnings.
                  </p>
                </>
              )}
            </div>
          )}

        {filteredAndSortedSources.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {filteredAndSortedSources.map((incomeSource, index) => (
              <Item key={incomeSource.id} variant="outline">
                <Badge variant="outline" className="shrink-0 text-xs">
                  #{index + 1}
                </Badge>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{incomeSource.name}</span>
                    <Badge variant="secondary">
                      {formatAmount(incomeSource.amount)}
                    </Badge>
                    {!incomeSource.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatPayday(
                        incomeSource.paydayDay,
                        incomeSource.paydayMonth
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDialog(true);
                      setEditingIncomeSource(incomeSource);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(incomeSource.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Item>
            ))}
          </div>
        )}

        {filteredAndSortedSources.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedSources.map((incomeSource, index) => (
              <Card key={incomeSource.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setShowDialog(true);
                          setEditingIncomeSource(incomeSource);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(incomeSource.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">{incomeSource.name}</h4>
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(incomeSource.amount)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatPayday(
                          incomeSource.paydayDay,
                          incomeSource.paydayMonth
                        )}
                      </span>
                    </div>
                    {!incomeSource.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
}
