"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Trash2, User } from "lucide-react";

interface RecipientManagerProps {
  recipientName: string;
  currentCategory?: string;
  onCategoryAssigned?: (category: string) => void;
  compact?: boolean;
}

export function RecipientManager({
  recipientName,
  currentCategory,
  onCategoryAssigned,
  compact = false,
}: RecipientManagerProps) {
  const user = db.useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [nickname, setNickname] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(currentCategory || "");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing recipient data
  const { data: recipientsData } = db.useQuery({
    recipients: {
      $: {
        where: {
          "user.id": user.id,
          originalName: recipientName,
        },
      },
    },
  });

  const existingRecipient = recipientsData?.recipients?.[0];

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "user.id": user.id },
        order: { name: "asc" },
      },
    },
  });

  const categories = categoriesData?.categories?.filter(
    (cat) => cat.isActive !== false
  ) || [];

  const handleOpenDialog = () => {
    setNickname(existingRecipient?.nickname || "");
    setSelectedCategory(existingRecipient?.defaultCategory || currentCategory || "");
    setNotes(existingRecipient?.notes || "");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!nickname.trim() && !selectedCategory && !notes.trim()) {
      alert("Please add at least a nickname, category, or notes");
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      
      if (existingRecipient) {
        // Update existing
        await db.transact([
          db.tx.recipients[existingRecipient.id].update({
            nickname: nickname.trim() || undefined,
            defaultCategory: selectedCategory || undefined,
            notes: notes.trim() || undefined,
            updatedAt: now,
          }),
        ]);
      } else {
        // Create new
        await db.transact([
          db.tx.recipients[id()]
            .update({
              originalName: recipientName,
              nickname: nickname.trim() || undefined,
              defaultCategory: selectedCategory || undefined,
              notes: notes.trim() || undefined,
              createdAt: now,
              updatedAt: now,
            })
            .link({ user: user.id }),
        ]);
      }

      if (selectedCategory && onCategoryAssigned) {
        onCategoryAssigned(selectedCategory);
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Failed to save recipient:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecipient) return;
    if (!confirm("Delete this recipient nickname and settings?")) return;

    try {
      await db.transact([db.tx.recipients[existingRecipient.id].delete()]);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to delete recipient:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  if (compact) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenDialog}
          className="h-6 px-2"
        >
          <Tag className="h-3 w-3" />
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Manage Recipient
              </DialogTitle>
              <DialogDescription>
                Add a nickname and default category for {recipientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Original Name</Label>
                <Input value={recipientName} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname (e.g., &quot;Eggs Guy&quot;, &quot;Weed Plug&quot;)</Label>
                <Input
                  id="nickname"
                  placeholder="Enter nickname..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Default Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select default category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this recipient..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {existingRecipient && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
