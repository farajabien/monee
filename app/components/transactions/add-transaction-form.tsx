"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import { findMostCommonCategoryForRecipient } from "@/lib/recipient-matcher";
import type { Transaction } from "@/types";

export default function AddTransactionForm() {
  const user = db.useUser();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoMatchedCategory, setAutoMatchedCategory] = useState<string | null>(null);

  // Fetch existing transactions for recipient matching
  const { data: transactionsData } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        limit: 1000, // Get enough transactions for matching
      },
    },
  });

  const existingTransactions: Transaction[] = useMemo(
    () => transactionsData?.transactions || [],
    [transactionsData]
  );

  // Auto-detect category when message changes
  useMemo(() => {
    if (!message.trim()) {
      setAutoMatchedCategory(null);
      return;
    }

    try {
      const parsed = parseMpesaMessage(message);
      if (parsed.recipient) {
        const matchedCategory = findMostCommonCategoryForRecipient(
          parsed.recipient,
          existingTransactions
        );
        setAutoMatchedCategory(matchedCategory);
      } else {
        setAutoMatchedCategory(null);
      }
    } catch {
      setAutoMatchedCategory(null);
    }
  }, [message, existingTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const parsed = parseMpesaMessage(message);
      
      // Use auto-matched category if available, otherwise "Uncategorized"
      const category = autoMatchedCategory || "Uncategorized";
      
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

      setMessage("");
      setAutoMatchedCategory(null);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please check the message format.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mpesa-message">Paste Mpesa Message</Label>
            <Textarea
              id="mpesa-message"
              placeholder="You sent Ksh 500.00 to John Doe on 15/01/24 at 10:30 AM. New M-PESA balance is Ksh 1,000.00"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            {autoMatchedCategory && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">Auto-matched:</Badge>
                <span className="text-muted-foreground">
                  Category will be set to &quot;{autoMatchedCategory}&quot;
                </span>
              </div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

