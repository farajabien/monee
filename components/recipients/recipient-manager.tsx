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
import { Tag, Trash2, User, Plus, Check } from "lucide-react";
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
  const { user } = db.useAuth();
  const [showSheet, setShowSheet] = useState(false);
  const [nickname, setNickname] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    currentCategory || ""
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  // Fetch existing recipient data and profile
  const { data: recipientsData } = db.useQuery({
    recipients: {
      $: {
        where: {
          "profile.user.id": user?.id || "",
          originalName: recipientName,
        },
      },
    },
  });

  const { data: profileData } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
    },
  });
  const profile = profileData?.profiles?.[0];

  const existingRecipient = recipientsData?.recipients?.[0];

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "profile.user.id": user?.id || "" },
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
            .link({ profile: profile?.id || "" }),
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
          className="h-8 w-8 p-0 hover:bg-accent/80 transition-all duration-150 active:scale-95"
          aria-label={`Manage recipient ${recipientName}`}
        >
          <Tag className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetContent
            side="bottom"
            className="pb-safe flex flex-col max-h-[90vh] w-full max-w-full rounded-t-xl border-t"
          >
            <SheetHeader className="shrink-0 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <SheetTitle className="text-lg font-semibold">
                    Manage Recipient
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    Customize {recipientName}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-6 px-1">
              {/* Original Name - Read Only */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Original Name
                </Label>
                <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    {recipientName}
                  </p>
                </div>
              </div>

              {/* Nickname Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="nickname"
                  className="text-sm font-semibold text-foreground"
                >
                  Nickname
                </Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Eggs Guy, Rice Plug"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-12 text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground pl-1">
                  Give this recipient a memorable name
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-semibold text-foreground"
                >
                  Default Category
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
                      className="flex-1 h-12 text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">None</span>
                      </SelectItem>
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
                    className="h-12 w-12 shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-150 active:scale-95"
                    aria-label="Add new category"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  Auto-assign expenses to this category
                </p>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-semibold text-foreground"
                >
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this recipient..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <SheetFooter className="shrink-0 flex flex-col gap-3 pt-4 border-t">
              {existingRecipient && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDelete}
                  className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive transition-all duration-150 active:scale-98"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Recipient
                </Button>
              )}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowSheet(false)}
                  className="flex-1 h-12 hover:bg-accent transition-all duration-150 active:scale-98"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="lg"
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
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

  // Non-compact mode: Full form view with improved spacing and touch targets
  return (
    <div className="space-y-6">
      {/* Original Name - Read Only */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Original Name
        </Label>
        <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground">{recipientName}</p>
        </div>
      </div>

      {/* Nickname Input */}
      <div className="space-y-2">
        <Label
          htmlFor="nickname-full"
          className="text-sm font-semibold text-foreground"
        >
          Nickname
        </Label>
        <Input
          id="nickname-full"
          placeholder="e.g., Eggs Guy, Rice Plug"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="h-12 text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted-foreground pl-1">
          Give this recipient a memorable name
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label
          htmlFor="category-full"
          className="text-sm font-semibold text-foreground"
        >
          Default Category
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
              className="flex-1 h-12 text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">None</span>
              </SelectItem>
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
            className="h-12 w-12 shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-150 active:scale-95"
            aria-label="Add new category"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pl-1">
          Auto-assign expenses to this category
        </p>
      </div>

      {/* Notes Textarea */}
      <div className="space-y-2">
        <Label
          htmlFor="notes-full"
          className="text-sm font-semibold text-foreground"
        >
          Notes
        </Label>
        <Textarea
          id="notes-full"
          placeholder="Add notes about this recipient..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none text-base transition-all duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        {existingRecipient && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleDelete}
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive transition-all duration-150 active:scale-98"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Recipient
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="w-full h-12 bg-primary hover:bg-primary/90 transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
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
