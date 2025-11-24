"use client";

import db from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipientManager } from "./recipient-manager";
import { Users } from "lucide-react";

export function RecipientList() {
  const user = db.useUser();

  const { data } = db.useQuery({
    recipients: {
      $: {
        where: { "user.id": user.id },
        order: { updatedAt: "desc" },
      },
    },
    transactions: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const savedRecipients = data?.recipients || [];
  const transactions = data?.transactions || [];

  // Get all unique recipients from transactions
  const uniqueRecipientNames = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.recipient) {
      uniqueRecipientNames.add(tx.recipient);
    }
  });

  // Calculate total amount spent per recipient
  const recipientTotals = new Map<string, { totalAmount: number; count: number }>();
  transactions.forEach((tx) => {
    if (tx.recipient) {
      const existing = recipientTotals.get(tx.recipient) || { totalAmount: 0, count: 0 };
      recipientTotals.set(tx.recipient, {
        totalAmount: existing.totalAmount + tx.amount,
        count: existing.count + 1,
      });
    }
  });

  // Merge saved recipients with transaction recipients
  const allRecipients = Array.from(uniqueRecipientNames).map((originalName) => {
    const saved = savedRecipients.find((r) => r.originalName === originalName);
    const totals = recipientTotals.get(originalName) || { totalAmount: 0, count: 0 };
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

  // Sort by updatedAt (saved ones first), then by originalName
  const recipients = allRecipients.sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return b.updatedAt - a.updatedAt;
    }
    if (a.updatedAt) return -1;
    if (b.updatedAt) return 1;
    return a.originalName.localeCompare(b.originalName);
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (recipients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No saved recipients yet</p>
          <p className="text-sm mt-2">
            Add nicknames to recipients from the Insights tab
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6" />
        Saved Recipients ({recipients.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {recipients.map((recipient) => (
          <Card key={recipient.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
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
                  <p className="text-xs text-muted-foreground">
                    {recipient.transactionCount} transaction{recipient.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <RecipientManager
                  recipientName={recipient.originalName}
                  currentCategory={recipient.defaultCategory}
                  compact
                />
              </div>

              {recipient.defaultCategory && (
                <Badge variant="secondary">{recipient.defaultCategory}</Badge>
              )}

              {recipient.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {recipient.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
