"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "@instantdb/react";
import { Calendar, Trash2, Copy, Bookmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/lib/db";
import type { Expense, IncomeSource, Debt, WishlistItem } from "@/types";

type TransactionType = "expense" | "income" | "debt" | "wishlist";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Expense | IncomeSource | Debt | WishlistItem;
  type: TransactionType;
  profileId?: string;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  type,
  profileId,
}: EditTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(type);
  const [formData, setFormData] = useState(() => {
    // Initialize form data based on transaction type
    if (type === "expense") {
      const exp = transaction as Expense;
      return {
        date: exp.date,
        amount: exp.amount,
        recipient: exp.recipient || "",
        category: exp.category || "",
        notes: exp.notes || "",
      };
    } else if (type === "income") {
      const inc = transaction as IncomeSource;
      return {
        date: inc.date,
        amount: inc.amount,
        source: inc.source || "",
        notes: inc.notes || "",
      };
    } else if (type === "debt") {
      const debt = transaction as Debt;
      return {
        date: debt.createdAt,
        amount: debt.currentBalance || debt.amount || 0,
        personName: debt.personName || "",
        direction: debt.direction || "I_OWE",
        dueDate: debt.dueDate || null,
        notes: debt.notes || "",
      };
    } else {
      const wish = transaction as WishlistItem;
      return {
        itemName: wish.itemName || "",
        amount: wish.amount || 0,
        status: wish.status || "want",
        notes: wish.notes || "",
      };
    }
  });

  const handleUpdate = async () => {
    try {
      if (type === "expense") {
        await db.transact([
          db.tx.expenses[transaction.id].update({
            amount: formData.amount,
            recipient: formData.recipient,
            category: formData.category,
            notes: formData.notes,
            date: formData.date,
          }),
        ]);
      } else if (type === "income") {
        await db.transact([
          db.tx.income[transaction.id].update({
            amount: formData.amount,
            source: (formData as any).source,
            notes: formData.notes,
            date: formData.date,
          }),
        ]);
      } else if (type === "debt") {
        await db.transact([
          db.tx.debts[transaction.id].update({
            currentBalance: formData.amount,
            personName: (formData as any).personName,
            direction: (formData as any).direction,
            dueDate: (formData as any).dueDate,
            notes: formData.notes,
          }),
        ]);
      } else if (type === "wishlist") {
        await db.transact([
          db.tx.wishlist[transaction.id].update({
            itemName: (formData as any).itemName,
            amount: formData.amount,
            status: (formData as any).status,
            notes: formData.notes,
          }),
        ]);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      if (type === "expense") {
        await db.transact([db.tx.expenses[transaction.id].delete()]);
      } else if (type === "income") {
        await db.transact([db.tx.income[transaction.id].delete()]);
      } else if (type === "debt") {
        await db.transact([db.tx.debts[transaction.id].delete()]);
      } else if (type === "wishlist") {
        await db.transact([db.tx.wishlist[transaction.id].delete()]);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      if (type === "expense") {
        await db.transact(
          db.tx.expenses[id()]
            .update({
              amount: formData.amount,
              recipient: formData.recipient,
              category: formData.category,
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "income") {
        await db.transact(
          db.tx.income[id()]
            .update({
              amount: formData.amount,
              source: (formData as any).source,
              type: "one-time",
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "debt") {
        await db.transact(
          db.tx.debts[id()]
            .update({
              amount: formData.amount,
              currentBalance: formData.amount,
              personName: (formData as any).personName,
              direction: (formData as any).direction,
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              status: "pending",
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "wishlist") {
        await db.transact(
          db.tx.wishlist[id()]
            .update({
              itemName: `${(formData as any).itemName} (Copy)`,
              amount: formData.amount,
              status: "want",
              notes: formData.notes,
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to duplicate transaction:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "expense" && "Expense"}
            {type === "income" && "Income"}
            {type === "debt" && "Debt"}
            {type === "wishlist" && "ELLIW Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Tabs (for expense/income only) */}
          {(type === "expense" || type === "income") && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Date Field */}
          {type !== "wishlist" && (
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(formData.date || Date.now()), "EEE, dd/MM/yyyy")}
                </span>
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>

          {/* Expense Fields */}
          {type === "expense" && (
            <>
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Input
                  value={(formData as any).recipient || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value } as any)
                  }
                  placeholder="Recipient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={(formData as any).category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value } as any)
                  }
                  placeholder="Category"
                />
              </div>
            </>
          )}

          {/* Income Fields */}
          {type === "income" && (
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={(formData as any).source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value } as any)
                }
                placeholder="Income source"
              />
            </div>
          )}

          {/* Debt Fields */}
          {type === "debt" && (
            <>
              <div className="space-y-2">
                <Label>Person Name</Label>
                <Input
                  value={(formData as any).personName}
                  onChange={(e) =>
                    setFormData({ ...formData, personName: e.target.value } as any)
                  }
                  placeholder="Person name"
                />
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <select
                  className="w-full p-2 rounded-md border bg-background"
                  value={(formData as any).direction}
                  onChange={(e) =>
                    setFormData({ ...formData, direction: e.target.value } as any)
                  }
                >
                  <option value="I_OWE">I Owe</option>
                  <option value="THEY_OWE_ME">They Owe Me</option>
                </select>
              </div>
            </>
          )}

          {/* Wishlist Fields */}
          {type === "wishlist" && (
            <>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={(formData as any).itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value } as any)
                  }
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full p-2 rounded-md border bg-background"
                  value={(formData as any).status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value } as any)
                  }
                >
                  <option value="want">Want</option>
                  <option value="got">Got</option>
                </select>
              </div>
            </>
          )}

          {/* Notes Field */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add a note..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={handleDuplicate}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={handleUpdate}
              className="gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
