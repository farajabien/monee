"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { RecipientManager } from "./recipient-manager";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  createRecipientListConfig,
  type RecipientWithStats,
} from "./recipient-list-config";

export function RecipientList() {
  const user = db.useUser();
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientWithStats | null>(null);
  const [showManageSheet, setShowManageSheet] = useState(false);

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

  // Calculate recipient stats
  const allRecipients: RecipientWithStats[] = useMemo(() => {
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

    // Merge saved recipients with expense recipients
    return Array.from(uniqueRecipientNames).map((originalName) => {
      const saved = savedRecipients.find(
        (r) => r.originalName === originalName
      );
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
        expenseCount: totals.count,
      };
    });
  }, [savedRecipients, expenses]);

  const handleManage = (recipient: RecipientWithStats) => {
    setSelectedRecipient(recipient);
    setShowManageSheet(true);
  };

  const config = createRecipientListConfig(handleManage);

  return (
    <>
      <UnifiedListContainer config={config} data={allRecipients} />

      {/* Manage Recipient Sheet */}
      <Sheet open={showManageSheet} onOpenChange={setShowManageSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage Recipient</SheetTitle>
            <SheetDescription>
              Set nickname and default category for this recipient
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedRecipient && (
              <RecipientManager
                recipientName={selectedRecipient.originalName}
                currentCategory={selectedRecipient.defaultCategory}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
