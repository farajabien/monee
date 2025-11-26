"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/components/ui/item";
import { RecipientManager } from "./recipient-manager";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { Users } from "lucide-react";

export function RecipientList() {
  const user = db.useUser();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount-high");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };

  const { data } = db.useQuery({
    recipients: {
      $: {
        where: { "user.id": user.id },
        order: { updatedAt: "desc" },
      },
    },
    expenses: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const savedRecipients = data?.recipients || [];
  const expenses = data?.expenses || [];

  // Get all unique recipients from expenses
  const uniqueRecipientNames = new Set<string>();
  expenses.forEach((tx) => {
    if (tx.recipient) {
      uniqueRecipientNames.add(tx.recipient);
    }
  });

  // Calculate total amount spent per recipient
  const recipientTotals = new Map<
    string,
    { totalAmount: number; count: number }
  >();
  expenses.forEach((tx) => {
    if (tx.recipient) {
      const existing = recipientTotals.get(tx.recipient) || {
        totalAmount: 0,
        count: 0,
      };
      recipientTotals.set(tx.recipient, {
        totalAmount: existing.totalAmount + tx.amount,
        count: existing.count + 1,
      });
    }
  });

  // Merge saved recipients with transaction recipients
  const allRecipients = Array.from(uniqueRecipientNames).map((originalName) => {
    const saved = savedRecipients.find((r) => r.originalName === originalName);
    const totals = recipientTotals.get(originalName) || {
      totalAmount: 0,
      count: 0,
    };
    return {
      id: saved?.id || originalName,
      originalName,
      nickname: saved?.nickname,
      defaultCategory: saved?.defaultCategory,
      notes: saved?.notes,
      updatedAt: saved?.updatedAt || 0,
      totalAmount: totals.totalAmount,
      transactionCount: totals.count,
    };
  });

  // Filter and sort recipients
  const filteredAndSortedRecipients = useMemo(() => {
    let result = [...allRecipients];

    // Search filter
    if (searchQuery) {
      result = result.filter((r) => {
        const displayName = r.nickname || r.originalName;
        return (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.defaultCategory
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "amount-high":
          return b.totalAmount - a.totalAmount;
        case "amount-low":
          return a.totalAmount - b.totalAmount;
        case "expenses":
          return b.transactionCount - a.transactionCount;
        case "name":
          const aName = a.nickname || a.originalName;
          const bName = b.nickname || b.originalName;
          return aName.localeCompare(bName);
        default:
          return b.totalAmount - a.totalAmount;
      }
    });

    return result;
  }, [allRecipients, searchQuery, sortBy]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Recipients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataViewControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search recipients..."
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: "amount-high", label: "Amount: High to Low" },
            { value: "amount-low", label: "Amount: Low to High" },
            { value: "expenses", label: "Most Expenses" },
            { value: "name", label: "Name (A-Z)" },
          ]}
          totalCount={allRecipients.length}
          filteredCount={filteredAndSortedRecipients.length}
        />

        {filteredAndSortedRecipients.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? (
              <p>No recipients found matching &quot;{searchQuery}&quot;</p>
            ) : (
              <>
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved recipients yet</p>
                <p className="text-sm mt-2">
                  Add nicknames to recipients from the Insights tab
                </p>
              </>
            )}
          </div>
        )}

        {filteredAndSortedRecipients.length > 0 && viewMode === "grid" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedRecipients.map((recipient, index) => (
              <Card key={recipient.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <RecipientManager
                      recipientName={recipient.originalName}
                      currentCategory={recipient.defaultCategory}
                      compact
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {recipient.nickname || recipient.originalName}
                    </p>
                    {recipient.nickname && (
                      <p className="text-sm text-muted-foreground">
                        {recipient.originalName}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {recipient.transactionCount} transaction
                        {recipient.transactionCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatAmount(recipient.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {recipient.defaultCategory && (
                    <Badge variant="secondary">
                      {recipient.defaultCategory}
                    </Badge>
                  )}

                  {recipient.notes && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                      {recipient.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAndSortedRecipients.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {filteredAndSortedRecipients.map((recipient, index) => (
              <Item key={recipient.id} variant="outline">
                <Badge variant="outline" className="text-xs shrink-0">
                  #{index + 1}
                </Badge>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold">
                      {recipient.nickname || recipient.originalName}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatAmount(recipient.totalAmount)}
                    </p>
                  </div>
                  {recipient.nickname && (
                    <p className="text-sm text-muted-foreground">
                      {recipient.originalName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {recipient.transactionCount} transaction
                      {recipient.transactionCount !== 1 ? "s" : ""}
                    </p>
                    {recipient.defaultCategory && (
                      <Badge variant="secondary">
                        {recipient.defaultCategory}
                      </Badge>
                    )}
                  </div>
                  {recipient.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {recipient.notes}
                    </p>
                  )}
                </div>
                <RecipientManager
                  recipientName={recipient.originalName}
                  currentCategory={recipient.defaultCategory}
                  compact
                />
              </Item>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
