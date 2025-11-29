"use client";

import { useState, useEffect } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Trash2, User, Plus } from "lucide-react";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";

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
  const [showSheet, setShowSheet] = useState(false);
  const [nickname, setNickname] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    currentCategory || ""
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

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

  const categories =
    categoriesData?.categories?.filter((cat) => cat.isActive !== false) || [];

  // Update form when existingRecipient changes (for non-compact mode)
  useEffect(() => {
    if (!compact && existingRecipient) {
      setNickname(existingRecipient.nickname || "");
      setSelectedCategory(
        existingRecipient.defaultCategory || currentCategory || ""
      );
      setNotes(existingRecipient.notes || "");
    }
  }, [existingRecipient, currentCategory, compact]);

  const handleOpenSheet = () => {
    setNickname(existingRecipient?.nickname || "");
    setSelectedCategory(
      existingRecipient?.defaultCategory || currentCategory || ""
    );
    setNotes(existingRecipient?.notes || "");
    setShowSheet(true);
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

      if (compact) {
        setShowSheet(false);
      }
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
      if (compact) {
        setShowSheet(false);
      }
    } catch (error) {
      console.error("Failed to delete recipient:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowAddCategoryDialog(false);
  };

  if (compact) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenSheet}
          className="h-6 px-2 hover:bg-accent/50 transition-colors"
          aria-label={`Manage recipient ${recipientName}`}
        >
          <Tag className="h-3 w-3" />
        </Button>

        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetContent
            side="bottom"
            className="pb-safe flex flex-col max-h-[85vh]"
          >
            <SheetHeader className="shrink-0">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Manage Recipient
              </SheetTitle>
              <SheetDescription className="text-sm">
                Add a nickname and default category for {recipientName}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Original Name</Label>
                <Input
                  value={recipientName}
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium">
                  Nickname{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Eggs Guy, Rice Plug"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Give this recipient a memorable name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Default Category{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCategory || "none"}
                    onValueChange={(val) =>
                      setSelectedCategory(val === "none" ? "" : val)
                    }
                  >
                    <SelectTrigger
                      id="category"
                      className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                    >
                      <SelectValue placeholder="Select default category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddCategoryDialog(true)}
                    className="shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                    aria-label="Add new category"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-assign expenses from this recipient to a category
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this recipient..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <SheetFooter className="shrink-0 flex flex-col sm:flex-row gap-2 pt-4 border-t">
              {existingRecipient && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="sm:mr-auto hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSheet(false)}
                  className="flex-1 sm:flex-none hover:bg-accent transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <AddCategoryDialog
          open={showAddCategoryDialog}
          onOpenChange={setShowAddCategoryDialog}
          onCategoryCreated={handleCategoryCreated}
        />
      </>
    );
  }

  // Non-compact mode: Full form view
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Original Name</Label>
        <Input
          value={recipientName}
          disabled
          className="bg-muted/50 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname-full" className="text-sm font-medium">
          Nickname{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="nickname-full"
          placeholder="e.g., Eggs Guy, Rice Plug"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="transition-all focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-muted-foreground">
          Give this recipient a memorable name
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-full" className="text-sm font-medium">
          Default Category{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="flex gap-2">
          <Select
            value={selectedCategory || "none"}
            onValueChange={(val) =>
              setSelectedCategory(val === "none" ? "" : val)
            }
          >
            <SelectTrigger
              id="category-full"
              className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
            >
              <SelectValue placeholder="Select default category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAddCategoryDialog(true)}
            className="shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
            aria-label="Add new category"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-assign expenses from this recipient to a category
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes-full" className="text-sm font-medium">
          Notes{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="notes-full"
          placeholder="Add notes about this recipient..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-2 pt-4">
        {existingRecipient && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
}
