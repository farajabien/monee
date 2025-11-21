"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import { findMostCommonCategoryForRecipient } from "@/lib/recipient-matcher";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import type { Transaction, Category } from "@/types";

export default function AddTransactionForm() {
  const user = db.useUser();
  const [messages, setMessages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<Array<{
    amount: number;
    recipient: string;
    date: number;
    category: string;
    rawMessage: string;
  }>>([]);

  // Fetch existing transactions for recipient matching
  const { data: transactionsData } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        limit: 1000,
      },
    },
  });

  const existingTransactions: Transaction[] = useMemo(
    () => transactionsData?.transactions || [],
    [transactionsData]
  );

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "user.id": user.id },
        order: { name: "asc" },
      },
    },
  });

  const categories: Category[] = (categoriesData?.categories || []).filter(
    (category) => category.isActive !== false
  );

  // Parse and preview transactions when messages change
  useMemo(() => {
    if (!messages.trim()) {
      setPreviewTransactions([]);
      return;
    }

    const messageLines = messages
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed = [];
    for (const message of messageLines) {
      try {
        const data = parseMpesaMessage(message);
        // Auto-match category based on recipient
        const autoCategory = data.recipient
          ? findMostCommonCategoryForRecipient(
              data.recipient,
              existingTransactions
            )
          : null;
        
        parsed.push({
          amount: data.amount,
          recipient: data.recipient || "Unknown",
          date: data.timestamp || Date.now(),
          category: autoCategory || selectedCategory || "Uncategorized",
          rawMessage: message,
        });
      } catch (error) {
        console.error("Failed to parse message:", message, error);
      }
    }
    setPreviewTransactions(parsed);
  }, [messages, existingTransactions, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages.trim() || previewTransactions.length === 0) return;

    setIsSubmitting(true);
    try {
      const messageLines = messages
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const message of messageLines) {
        try {
          const parsed = parseMpesaMessage(message);
          
          // Auto-match category based on recipient, fallback to selected or uncategorized
          let category = selectedCategory || "Uncategorized";
          if (parsed.recipient) {
            const autoCategory = findMostCommonCategoryForRecipient(
              parsed.recipient,
              existingTransactions
            );
            if (autoCategory) {
              category = autoCategory;
            }
          }

          await db.transact(
            db.tx.transactions[id()]
              .update({
                amount: parsed.amount,
                recipient: parsed.recipient || "",
                date: parsed.timestamp || Date.now(),
                category,
                rawMessage: message,
                parsedData: parsed,
                createdAt: Date.now(),
              })
              .link({ user: user.id })
          );
        } catch (error) {
          console.error("Failed to parse message:", message, error);
        }
      }

      setMessages("");
      setSelectedCategory("");
      setPreviewTransactions([]);
    } catch (error) {
      console.error("Error adding transactions:", error);
      alert("Failed to add transactions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowAddCategoryDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add Transaction(s)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste one or multiple Mpesa messages (one per line)
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-messages">Paste Mpesa Message(s)</Label>
              <Textarea
                id="mpesa-messages"
                placeholder="TKLPNAO4DP Confirmed. Ksh27.00 sent to SAFARICOM DATA BUNDLES for account SAFARICOM DATA BUNDLES on 21/11/25 at 12:33 PM...&#10;TKLPNAO6ZG Confirmed. Ksh100.00 sent to DORNALD OWUOR 0700377906 on 21/11/25 at 12:35 PM..."
                value={messages}
                onChange={(e) => setMessages(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-select">
                Default Category (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Will be used for transactions without auto-matched categories
              </p>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-select" className="flex-1">
                    <SelectValue placeholder="Auto-match or select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-match</SelectItem>
                    <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCategoryDialog(true)}
                >
                  + New
                </Button>
              </div>
            </div>

            {previewTransactions.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Preview ({previewTransactions.length} transaction
                  {previewTransactions.length !== 1 ? "s" : ""})
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(() => {
                    // Group by date
                    const grouped = previewTransactions.reduce((acc, tx) => {
                      const dateKey = new Date(tx.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(tx);
                      return acc;
                    }, {} as Record<string, typeof previewTransactions>);

                    return Object.entries(grouped).map(([date, txs]) => (
                      <div key={date} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground px-2">
                          {date} ({txs.length})
                        </p>
                        {txs.map((tx, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between text-sm p-2 rounded bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{tx.recipient}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {tx.category}
                              </Badge>
                            </div>
                            <span className="font-semibold">
                              Ksh {tx.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !messages.trim() || previewTransactions.length === 0}
            >
              {isSubmitting
                ? "Adding..."
                : `Add ${previewTransactions.length} Transaction${previewTransactions.length !== 1 ? "s" : ""}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}

