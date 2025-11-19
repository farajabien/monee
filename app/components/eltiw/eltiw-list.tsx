"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Plus, X } from "lucide-react";
import type { EltiwItem } from "@/types";

export default function EltiwList() {
  const user = db.useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { isLoading, error, data } = db.useQuery({
    eltiw_items: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim()) return;

    await db.transact(
      db.tx.eltiw_items[id()]
        .update({
          name: name.trim(),
          amount: parseFloat(amount),
          reason: reason.trim() || undefined,
          gotIt: false,
          createdAt: Date.now(),
        })
        .link({ user: user.id })
    );

    setName("");
    setAmount("");
    setReason("");
    setShowAddForm(false);
  };

  const handleGotIt = (item: EltiwItem) => {
    db.transact(
      db.tx.eltiw_items[item.id].update({
        gotIt: true,
        gotItDate: new Date().getTime(),
      })
    );
  };

  const handleDelete = (itemId: string) => {
    db.transact(db.tx.eltiw_items[itemId].delete());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const items = data?.eltiw_items || [];
  const activeItems = items.filter((item: EltiwItem) => !item.gotIt);
  const completedItems = items.filter((item: EltiwItem) => item.gotIt);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Every Little Thing I Want</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <form
              onSubmit={handleAdd}
              className="space-y-4 p-4 border rounded-lg"
            >
              <div className="space-y-2">
                <Label htmlFor="eltiw-name">What do you want?</Label>
                <Input
                  id="eltiw-name"
                  placeholder="New shoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eltiw-amount">Amount (Ksh)</Label>
                <Input
                  id="eltiw-amount"
                  type="number"
                  placeholder="3000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eltiw-reason">Reason (optional)</Label>
                <Textarea
                  id="eltiw-reason"
                  placeholder="Because I deserve it!"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setName("");
                    setAmount("");
                    setReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {activeItems.length === 0 && completedItems.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-2">Your wishlist is empty.</p>
              <p className="text-sm">Add something you want for yourself!</p>
            </div>
          )}

          {activeItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Active</h3>
              {activeItems.map((item: EltiwItem) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.name}</span>
                          <Badge variant="secondary">
                            {formatAmount(item.amount)}
                          </Badge>
                        </div>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground">
                            {item.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGotIt(item)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Got it!
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {completedItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed 🎉
              </h3>
              {completedItems.map((item: EltiwItem) => (
                <Card key={item.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold line-through">
                            {item.name}
                          </span>
                          <Badge variant="default">
                            {formatAmount(item.amount)}
                          </Badge>
                        </div>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground">
                            {item.reason}
                          </p>
                        )}
                        {item.gotItDate && (
                          <p className="text-xs text-muted-foreground">
                            Got it on{" "}
                            {new Date(item.gotItDate).toLocaleDateString(
                              "en-KE"
                            )}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
