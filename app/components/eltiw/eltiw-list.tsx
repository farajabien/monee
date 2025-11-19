"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Plus, X, ExternalLink, Calendar } from "lucide-react";
import type { EltiwItem } from "@/types";

export default function EltiwList() {
  const user = db.useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [link, setLink] = useState("");
  const [deadline, setDeadline] = useState("");

  const now = useMemo(() => new Date().getTime(), []);

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

    const deadlineTimestamp = deadline
      ? new Date(deadline).getTime()
      : undefined;

    await db.transact(
      db.tx.eltiw_items[id()]
        .update({
          name: name.trim(),
          amount: parseFloat(amount),
          reason: reason.trim() || undefined,
          link: link.trim() || undefined,
          deadline: deadlineTimestamp,
          gotIt: false,
          createdAt: Date.now(),
        })
        .link({ user: user.id })
    );

    setName("");
    setAmount("");
    setReason("");
    setLink("");
    setDeadline("");
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

  const formatDeadline = (deadline: number | undefined) => {
    if (!deadline) return null;

    const diff = deadline - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return `Overdue by ${Math.abs(days)} day${
        Math.abs(days) !== 1 ? "s" : ""
      }`;
    } else if (days === 0) {
      return "Due today";
    } else if (days === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${days} days`;
    }
  };

  const getDeadlineBadgeVariant = (deadline: number | undefined) => {
    if (!deadline) return "secondary";
    const diff = deadline - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "destructive";
    if (days <= 3) return "default";
    return "secondary";
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
              <div className="space-y-2">
                <Label htmlFor="eltiw-link">Link (optional)</Label>
                <Input
                  id="eltiw-link"
                  type="url"
                  placeholder="https://example.com/product"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eltiw-deadline">Deadline (optional)</Label>
                <Input
                  id="eltiw-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
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
                    setLink("");
                    setDeadline("");
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{item.name}</span>
                          <Badge variant="secondary">
                            {formatAmount(item.amount)}
                          </Badge>
                          {item.deadline && (
                            <Badge
                              variant={getDeadlineBadgeVariant(item.deadline)}
                              className="flex items-center gap-1"
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDeadline(item.deadline)}
                            </Badge>
                          )}
                        </div>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground">
                            {item.reason}
                          </p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View link
                          </a>
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
                        <div className="flex items-center gap-2 flex-wrap">
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
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit opacity-60"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View link
                          </a>
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
