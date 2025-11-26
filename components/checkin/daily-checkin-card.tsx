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
import type { Expense } from "@/types";

export default function DailyCheckinCard() {
  const user = db.useUser();
  const [messages, setMessages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's check-in
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const { data: checkinData } = db.useQuery({
    daily_checkins: {
      $: {
        where: {
          "user.id": user.id,
          date: todayTimestamp,
        },
      },
    },
  });

  const todayCheckin = checkinData?.daily_checkins?.[0];

  // Get today's expenses
  const { data: transactionsData } = db.useQuery({
    expenses: {
      $: {
        where: {
          "user.id": user.id,
          date: { $gte: todayTimestamp },
        },
        order: { createdAt: "desc" },
      },
    },
  });

  const todayTransactions = transactionsData?.expenses || [];

  // Fetch existing expenses for recipient matching
  const { data: allTransactionsData } = db.useQuery({
    expenses: {
      $: {
        where: { "user.id": user.id },
        limit: 1000, // Get enough expenses for matching
      },
    },
  });

  const existingTransactions: Expense[] = useMemo(
    () => allTransactionsData?.expenses || [],
    [allTransactionsData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages.trim()) return;

    setIsSubmitting(true);
    try {
      const messageLines = messages
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const expenses = [];
      for (const message of messageLines) {
        try {
          const parsed = parseMpesaMessage(message);
          // Auto-match category based on recipient
          const category = parsed.recipient
            ? findMostCommonCategoryForRecipient(
                parsed.recipient,
                existingTransactions
              ) || "Uncategorized"
            : "Uncategorized";

          expenses.push({
            amount: parsed.amount,
            recipient: parsed.recipient || "",
            date: parsed.timestamp || Date.now(),
            category,
            rawMessage: message,
            parsedData: parsed,
            createdAt: Date.now(),
          });
        } catch (error) {
          console.error("Failed to parse message:", message, error);
        }
      }

      // Create all expenses first
      for (const t of expenses) {
        await db.transact(
          db.tx.expenses[id()].update(t).link({ user: user.id })
        );
      }

      // Then create or update daily check-in
      if (todayCheckin) {
        await db.transact(
          db.tx.daily_checkins[todayCheckin.id].update({
            completed: true,
            transactionsCount: todayCheckin.transactionsCount + expenses.length,
          })
        );
      } else {
        await db.transact(
          db.tx.daily_checkins[id()]
            .update({
              date: todayTimestamp,
              completed: true,
              transactionsCount: expenses.length,
            })
            .link({ user: user.id })
        );
      }
      setMessages("");
    } catch (error) {
      console.error("Error during check-in:", error);
      alert("Failed to complete check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-In</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(Date.now())}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayCheckin?.completed ? (
            <div className="space-y-2">
              <Badge variant="default" className="w-fit">
                ✓ Completed
              </Badge>
              <p className="text-sm text-muted-foreground">
                You&apos;ve recorded {todayCheckin.transactionsCount}{" "}
                transaction
                {todayCheckin.transactionsCount !== 1 ? "s" : ""} today.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">
                Pending
              </Badge>
              <p className="text-sm text-muted-foreground">
                Did you record today&apos;s spending?
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-messages">
                Paste all your Mpesa messages for today (one per line)
              </Label>
              <Textarea
                id="checkin-messages"
                placeholder="You sent Ksh 500.00 to John Doe on 15/01/24 at 10:30 AM...&#10;You bought goods worth Ksh 1,200.00 from Shop Name..."
                value={messages}
                onChange={(e) => setMessages(e.target.value)}
                rows={6}
                disabled={todayCheckin?.completed}
              />
            </div>
            {!todayCheckin?.completed && (
              <Button type="submit" disabled={isSubmitting || !messages.trim()}>
                {isSubmitting ? "Processing..." : "Complete Check-In"}
              </Button>
            )}
          </form>

          {todayTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Today&apos;s Expenses</p>
              <div className="space-y-1">
                {todayTransactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="text-sm flex justify-between items-center"
                  >
                    <span className="text-muted-foreground">
                      {tx.recipient || "Expense"}
                    </span>
                    <span className="font-medium">
                      Ksh {tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {todayTransactions.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{todayTransactions.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
