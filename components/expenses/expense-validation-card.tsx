/**
 * ExpenseValidationCard Component
 *
 * Compact mobile-friendly card layout for validating imported expenses
 * Shows transaction details with edit, accept, reject actions
 * Uses design tokens from globals.css and follows compact-item-card patterns
 */

"use client";

import { useState } from "react";
import {
  Check,
  X,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ValidationRow } from "./expense-import-validation";

interface ExpenseValidationCardProps {
  row: ValidationRow;
  categories: string[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string, overrides: ValidationRow["overrides"]) => void;
  onAccept: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
}

export function ExpenseValidationCard({
  row,
  categories,
  isSelected,
  onToggleSelect,
  onEdit,
  onAccept,
  onReject,
}: ExpenseValidationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<ValidationRow["overrides"]>({
    recipient: row.overrides?.recipient || row.recipientMatch.recipientName,
    category: row.overrides?.category || row.recipientMatch.suggestedCategory,
    amount: row.overrides?.amount || row.parsed.amount,
    recurringId:
      row.overrides?.recurringId || row.recurringMatch?.recurringExpenseId,
  });

  const isPending = row.status === "pending";

  const handleSaveEdit = () => {
    onEdit(row.id, editValues);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValues({
      recipient: row.overrides?.recipient || row.recipientMatch.recipientName,
      category: row.overrides?.category || row.recipientMatch.suggestedCategory,
      amount: row.overrides?.amount || row.parsed.amount,
      recurringId:
        row.overrides?.recurringId || row.recurringMatch?.recurringExpenseId,
    });
    setIsEditing(false);
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Low
          </Badge>
        );
    }
  };

  const getCardBorderClass = () => {
    if (row.status === "accepted") {
      return "border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-950/30";
    }
    if (row.status === "rejected") {
      return "border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950/30 opacity-60";
    }
    if (isPending) {
      switch (row.recipientMatch.confidence) {
        case "high":
          return "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20";
        case "medium":
          return "border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20";
        case "low":
          return "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20";
      }
    }
    return "";
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-3 space-y-3 transition-colors",
          isSelected && "ring-2 ring-primary"
        )}
      >
        {/* Edit Mode: Full form */}
        <div className="space-y-2">
          <div>
            <Label htmlFor={`amount-${row.id}`} className="text-xs">
              Amount
            </Label>
            <Input
              id={`amount-${row.id}`}
              type="number"
              value={editValues?.amount ?? 0}
              onChange={(e) =>
                setEditValues({
                  ...editValues,
                  amount: parseFloat(e.target.value),
                })
              }
              className="h-8 mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`recipient-${row.id}`} className="text-xs">
              Recipient
            </Label>
            <Input
              id={`recipient-${row.id}`}
              value={editValues?.recipient ?? ""}
              onChange={(e) =>
                setEditValues({
                  ...editValues,
                  recipient: e.target.value,
                })
              }
              className="h-8 mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`category-${row.id}`} className="text-xs">
              Category
            </Label>
            <Select
              value={editValues?.category ?? ""}
              onValueChange={(value) =>
                setEditValues({
                  ...editValues,
                  category: value,
                })
              }
            >
              <SelectTrigger id={`category-${row.id}`} className="h-8 mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            className="flex-1 h-7"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveEdit} className="flex-1 h-7">
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card hover:bg-accent/30 transition-colors",
        getCardBorderClass(),
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 min-h-[52px]">
        {/* Left Section: Checkbox + Amount */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(row.id)}
              className="h-4 w-4 rounded border-border"
            />
          )}
          <div className="px-2 py-1 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30">
            KSh {(row.overrides?.amount || row.parsed.amount).toLocaleString()}
          </div>
        </div>

        {/* Middle Section: Recipient + Metadata */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="font-medium text-sm truncate"
              title={
                row.overrides?.recipient || row.recipientMatch.recipientName
              }
            >
              {row.overrides?.recipient || row.recipientMatch.recipientName}
            </span>

            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap"
            >
              {row.overrides?.category || row.recipientMatch.suggestedCategory}
            </Badge>

            {row.parsed.timestamp && (
              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                {new Date(row.parsed.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}

            {getConfidenceBadge(row.recipientMatch.confidence)}

            {row.recurringMatch?.isMatch && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap"
              >
                🔁 Recurring
              </Badge>
            )}

            {!isPending && (
              <Badge
                variant={row.status === "accepted" ? "default" : "destructive"}
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {row.status === "accepted" ? "✓ Accepted" : "✗ Rejected"}
              </Badge>
            )}
          </div>

          {row.parsed.phoneNumber && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.parsed.phoneNumber}
            </span>
          )}
        </div>

        {/* Right Section: Action Buttons */}
        {isPending && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAccept([row.id])}
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Accept</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject([row.id])}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Reject</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
