"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit2, Check, X } from "lucide-react";
import type { ImportedTransaction } from "@/types";

interface ImportReviewTableProps {
  transactions: ImportedTransaction[];
  onTransactionUpdate: (id: string, updates: Partial<ImportedTransaction>) => void;
  onTransactionDelete: (id: string) => void;
  onSaveSelected: () => void;
  existingCategories?: string[];
}

export function ImportReviewTable({
  transactions,
  onTransactionUpdate,
  onTransactionDelete,
  onSaveSelected,
  existingCategories = [],
}: ImportReviewTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(true);

  const keptTransactions = transactions.filter((t) => t.status === "keep");
  const allSelected = keptTransactions.length === transactions.length && transactions.length > 0;

  const handleToggleSelect = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      onTransactionUpdate(id, {
        status: transaction.status === "keep" ? "delete" : "keep",
      });
    }
  };

  const handleSelectAll = () => {
    const newStatus = !allSelected;
    transactions.forEach((t) => {
      onTransactionUpdate(t.id, { status: newStatus ? "keep" : "delete" });
    });
    setSelectAll(newStatus);
  };

  const handleBulkDelete = () => {
    transactions.forEach((t) => {
      if (t.status === "delete") {
        onTransactionDelete(t.id);
      }
    });
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "send":
        return "destructive";
      case "receive":
        return "default";
      case "buy":
        return "secondary";
      case "withdraw":
        return "outline";
      case "deposit":
        return "default";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "send":
        return "Send";
      case "receive":
        return "Receive";
      case "buy":
        return "Buy";
      case "withdraw":
        return "Withdraw";
      case "deposit":
        return "Deposit";
      default:
        return "Unknown";
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions parsed yet. Paste M-Pesa messages above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({keptTransactions.length} of {transactions.length})
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={transactions.filter((t) => t.status === "delete").length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Unselected
          </Button>
          <Button
            size="sm"
            onClick={onSaveSelected}
            disabled={keptTransactions.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Save {keptTransactions.length} Transaction{keptTransactions.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      {/* Responsive table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const isEditing = editingId === transaction.id;
                const isKept = transaction.status === "keep";

                return (
                  <TableRow
                    key={transaction.id}
                    className={!isKept ? "opacity-50 bg-muted/20" : ""}
                  >
                    {/* Select checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={isKept}
                        onCheckedChange={() => handleToggleSelect(transaction.id)}
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs">
                      {format(new Date(transaction.date), "dd/MM/yy")}
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={transaction.amount}
                          onChange={(e) =>
                            onTransactionUpdate(transaction.id, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium">
                          {transaction.amount.toLocaleString()}
                        </span>
                      )}
                    </TableCell>

                    {/* Recipient */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={transaction.recipient || ""}
                          onChange={(e) =>
                            onTransactionUpdate(transaction.id, {
                              recipient: e.target.value,
                            })
                          }
                          className="w-32 h-8 text-sm"
                          placeholder="Recipient"
                        />
                      ) : (
                        <span className="text-sm">{transaction.recipient || "—"}</span>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge variant={getTypeColor(transaction.mpesaExpenseType)}>
                        {getTypeLabel(transaction.mpesaExpenseType)}
                      </Badge>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={transaction.category || ""}
                          onValueChange={(value) =>
                            onTransactionUpdate(transaction.id, { category: value })
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-sm">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                            {existingCategories.length === 0 && (
                              <SelectItem value="Uncategorized">
                                Uncategorized
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {transaction.category || "Uncategorized"}
                        </span>
                      )}
                    </TableCell>

                    {/* Reference */}
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {transaction.mpesaReference || "—"}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingId(transaction.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => onTransactionDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <div>
          <span className="font-medium">{keptTransactions.length}</span> transaction
          {keptTransactions.length !== 1 ? "s" : ""} selected for import
        </div>
        <div>
          Total:{" "}
          <span className="font-medium">
            KSh{" "}
            {keptTransactions
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
