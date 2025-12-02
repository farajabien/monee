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
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createRecipientListConfig,
  type RecipientWithStats,
} from "./recipient-list-config";
import { useCurrency } from "@/hooks/use-currency";

export function RecipientList() {
  const user = db.useUser();
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientWithStats | null>(null);
  const [showManageSheet, setShowManageSheet] = useState(false);

  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      recipients: {
        $: {
          order: { updatedAt: "desc" },
        },
      },
      expenses: {},
    },
  });

  const profile = data?.profiles?.[0];
  const savedRecipients = profile?.recipients || [];
  const expenses = profile?.expenses || [];

  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

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

  const config = useMemo(() => createRecipientListConfig(handleManage, formatCurrency), [formatCurrency]);

  return (
    <>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">All Recipients</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <UnifiedListContainer<RecipientWithStats>
            config={config}
            data={allRecipients}
          />
        </TabsContent>
        <TabsContent value="stats">
          {/* Placeholder for future statistics view */}
          <div className="text-center text-muted-foreground py-8">
            Statistics view coming soon
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={showManageSheet} onOpenChange={setShowManageSheet}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto pb-safe"
        >
          <SheetHeader>
            <SheetTitle>Manage Recipient</SheetTitle>
          </SheetHeader>
          {selectedRecipient && (
            <div className="mt-6">
              <RecipientManager
                recipientName={selectedRecipient.originalName}
                currentCategory={selectedRecipient.defaultCategory}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
