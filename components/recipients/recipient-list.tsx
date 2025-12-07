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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import type { Recipient, Expense } from "@/types";

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
  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

  // Calculate recipient stats with percentage
  const allRecipients: RecipientWithStats[] = useMemo(() => {
    const savedRecipients = (profile?.recipients || []) as Recipient[];
    const expenses = (profile?.expenses || []) as Expense[];

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
    let grandTotal = 0;

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
        grandTotal += tx.amount;
      }
    });

    // Merge saved recipients with expense recipients
    return Array.from(uniqueRecipientNames)
      .map((originalName) => {
        const saved = savedRecipients.find(
          (r) => r.originalName === originalName
        );
        const totals = recipientTotals.get(originalName) || {
          totalAmount: 0,
          count: 0,
        };
        const percentage =
          grandTotal > 0 ? (totals.totalAmount / grandTotal) * 100 : 0;

        return {
          id: saved?.id || originalName,
          originalName,
          nickname: saved?.nickname,
          defaultCategory: saved?.defaultCategory,
          notes: saved?.notes,
          updatedAt: saved?.updatedAt || 0,
          totalAmount: totals.totalAmount,
          expenseCount: totals.count,
          percentageOfExpenses: percentage,
        } as RecipientWithStats;
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [profile?.recipients, profile?.expenses]);

  const handleManage = (recipient: RecipientWithStats) => {
    setSelectedRecipient(recipient);
    setShowManageSheet(true);
  };

  const config = useMemo(
    () => createRecipientListConfig(handleManage, formatCurrency),
    [formatCurrency]
  );

  return (
    <div className="px-4">
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Expenses Count</TableHead>
                  <TableHead className="text-center">% of Expenses</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRecipients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No recipients found
                    </TableCell>
                  </TableRow>
                ) : (
                  allRecipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {recipient.nickname || recipient.originalName}
                          </div>
                          {recipient.nickname && (
                            <div className="text-xs text-muted-foreground">
                              {recipient.originalName}
                            </div>
                          )}
                          {recipient.defaultCategory && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Default: {recipient.defaultCategory}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(recipient.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {recipient.expenseCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {recipient.percentageOfExpenses.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManage(recipient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <UnifiedListContainer<RecipientWithStats>
            config={config}
            data={allRecipients}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Total Recipients
                </div>
                <div className="text-2xl font-bold">{allRecipients.length}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Total Expenses
                </div>
                <div className="text-2xl font-bold">
                  {allRecipients.reduce((sum, r) => sum + r.expenseCount, 0)}
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-2">
                Top Recipients by Spending
              </div>
              <div className="space-y-2">
                {allRecipients.slice(0, 5).map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {recipient.nickname || recipient.originalName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatCurrency(recipient.totalAmount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({recipient.percentageOfExpenses.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  );
}
