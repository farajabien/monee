"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, X, ArrowRight } from "lucide-react";
import type { DuplicateMatch, ConfidenceLevel } from "@/lib/duplicate-detector";
import type { ParsedExpenseData } from "@/types";
import { useCurrency } from "@/hooks/use-currency";

interface DuplicateDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newTransaction: ParsedExpenseData;
  matches: DuplicateMatch[];
  onMerge: (expenseId: string) => void;
  onKeepSeparate: () => void;
  onCancel: () => void;
  userCurrency?: string;
  userLocale?: string;
}

export function DuplicateDetectionDialog({
  isOpen,
  onClose,
  newTransaction,
  matches,
  onMerge,
  onKeepSeparate,
  onCancel,
  userCurrency,
  userLocale,
}: DuplicateDetectionDialogProps) {
  const { formatCurrency } = useCurrency(userCurrency, userLocale);

  if (matches.length === 0) {
    return null;
  }

  const topMatch = matches[0];
  const { expense, confidence, matchReasons } = topMatch;

  // Format date helper
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(userLocale || "en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Confidence badge color
  const getConfidenceBadgeVariant = (
    confidence: ConfidenceLevel
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (confidence) {
      case "exact":
        return "destructive";
      case "likely":
        return "default";
      case "possible":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <DialogTitle>Potential Duplicate Transaction Detected</DialogTitle>
          </div>
          <DialogDescription>
            We found a transaction that might be a duplicate. Review the details below and choose how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence Level:</span>
            <Badge variant={getConfidenceBadgeVariant(confidence)}>
              {confidence.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({matchReasons.join(", ")})
            </span>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 rounded-lg border p-4">
            {/* New Transaction */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-green-600 dark:text-green-400">
                  New Transaction
                </h4>
                <Badge variant="outline" className="text-xs">
                  From Statement
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-semibold">{formatCurrency(newTransaction.amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recipient:</span>
                  <p className="font-medium">{newTransaction.recipient || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p>
                    {newTransaction.timestamp
                      ? formatDate(newTransaction.timestamp)
                      : "—"}
                  </p>
                </div>
                {newTransaction.reference && (
                  <div>
                    <span className="text-muted-foreground">M-PESA Ref:</span>
                    <p className="font-mono text-xs">
                      {newTransaction.reference}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Existing Transaction */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                  Existing Transaction
                </h4>
                <Badge variant="outline" className="text-xs">
                  Already Recorded
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recipient:</span>
                  <p className="font-medium">{expense.recipient || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p>{formatDate(expense.date)}</p>
                </div>
                {expense.mpesaReference && (
                  <div>
                    <span className="text-muted-foreground">M-PESA Ref:</span>
                    <p className="font-mono text-xs">
                      {expense.mpesaReference}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p>{expense.category || "Uncategorized"}</p>
                </div>
                {expense.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="text-xs">{expense.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Indicators */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              {Math.abs(newTransaction.amount - expense.amount) < 1 ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Amount Match</span>
            </div>
            <div className="flex items-center gap-1">
              {newTransaction.recipient &&
              expense.recipient &&
              newTransaction.recipient.toLowerCase().includes(expense.recipient.toLowerCase()) ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Recipient Match</span>
            </div>
            <div className="flex items-center gap-1">
              {newTransaction.reference && expense.mpesaReference ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>M-PESA Reference</span>
            </div>
          </div>

          {/* Additional Matches */}
          {matches.length > 1 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Found {matches.length - 1} more potential{" "}
                {matches.length === 2 ? "match" : "matches"}.{" "}
                <span className="font-medium">
                  Showing the most likely duplicate.
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel Import
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onKeepSeparate}
            className="w-full sm:w-auto"
          >
            Keep as Separate
          </Button>
          <Button
            type="button"
            onClick={() => onMerge(expense.id)}
            className="w-full sm:w-auto"
          >
            Merge & Update Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
