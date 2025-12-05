/**
 * ExpenseValidationCard Component
 *
 * Mobile-friendly card layout for validating imported expenses
 * Shows transaction details with edit, accept, reject actions
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
import { Card, CardContent } from "@/components/ui/card";
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
    category: row.overrides?.category || row.recipientMatch.category,
    amount: row.overrides?.amount || row.parsed.amount,
    recurringId: row.overrides?.recurringId || row.recurringMatch?.recurringId,
  });

  const isPending = row.status === "pending";

  const handleSaveEdit = () => {
    onEdit(row.id, editValues);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValues({
      recipient: row.overrides?.recipient || row.recipientMatch.recipientName,
      category: row.overrides?.category || row.recipientMatch.category,
      amount: row.overrides?.amount || row.parsed.amount,
      recurringId: row.overrides?.recurringId || row.recurringMatch?.recurringId,
    });
    setIsEditing(false);
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Low
          </Badge>
        );
    }
  };

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "border-green-200 bg-green-50/50";
      case "medium":
        return "border-yellow-200 bg-yellow-50/50";
      case "low":
        return "border-red-200 bg-red-50/50";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all",
        isPending && getConfidenceColor(row.recipientMatch.confidence),
        row.status === "accepted" && "bg-green-50/50 border-green-200",
        row.status === "rejected" && "bg-red-50/50 border-red-200 opacity-60",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header: Checkbox + Amount + Date */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isPending && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(row.id)}
                className="h-5 w-5 mt-0.5 rounded border-gray-300"
              />
            )}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-1">
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
                    className="h-8"
                  />
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-lg font-bold">
                    KSh {(row.overrides?.amount || row.parsed.amount).toLocaleString()}
                  </p>
                  {row.parsed.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.parsed.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Confidence Badge */}
          <div>{getConfidenceBadge(row.recipientMatch.confidence)}</div>
        </div>

        {/* Recipient */}
        <div className="space-y-1">
          {isEditing ? (
            <>
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
                className="h-8"
              />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-medium text-sm">
                {row.overrides?.recipient || row.recipientMatch.recipientName}
              </p>
              {row.parsed.phoneNumber && (
                <p className="text-xs text-muted-foreground font-mono">
                  {row.parsed.phoneNumber}
                </p>
              )}
            </>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          {isEditing ? (
            <>
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
                <SelectTrigger id={`category-${row.id}`} className="h-8">
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
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Category</p>
              <Badge variant="secondary" className="font-normal">
                {row.overrides?.category || row.recipientMatch.category}
              </Badge>
            </>
          )}
        </div>

        {/* Recurring Status (if applicable) */}
        {row.recurringMatch && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recurring</p>
            <Badge
              variant={row.recurringMatch.isRecurring ? "default" : "outline"}
              className="font-normal"
            >
              {row.recurringMatch.isRecurring ? "Linked" : "Not Linked"}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="flex-1"
              >
                Save
              </Button>
            </>
          ) : isPending ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAccept([row.id])}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Check className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject([row.id])}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </>
          ) : (
            <div className="flex-1 text-center py-1">
              <Badge
                variant={row.status === "accepted" ? "default" : "destructive"}
                className="font-normal"
              >
                {row.status === "accepted" ? "Accepted" : "Rejected"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
