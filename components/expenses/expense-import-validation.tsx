"use client";

import { useState } from "react";
import { Check, X, Edit2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ParsedExpenseData } from "@/types";
import type { RecipientMatch } from "@/lib/recipient-matcher";
import type { RecurringMatch } from "@/lib/recurring-matcher";

export interface ValidationRow {
  id: string;
  parsed: ParsedExpenseData;
  recipientMatch: RecipientMatch;
  recurringMatch: RecurringMatch;
  status: "pending" | "accepted" | "rejected" | "edited";
  overrides?: {
    recipient?: string;
    category?: string;
    amount?: number;
    recurringId?: string;
  };
}

interface ExpenseImportValidationProps {
  rows: ValidationRow[];
  categories: string[];
  onAccept: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
  onEdit: (id: string, overrides: ValidationRow["overrides"]) => void;
  onSave: () => void;
}

export function ExpenseImportValidation({
  rows,
  categories,
  onAccept,
  onReject,
  onEdit,
  onSave,
}: ExpenseImportValidationProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ValidationRow["overrides"]>(undefined);

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === pendingRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pendingRows.map((r) => r.id)));
    }
  };

  const startEdit = (row: ValidationRow) => {
    setEditingRow(row.id);
    setEditValues({
      recipient: row.overrides?.recipient || row.recipientMatch.recipientName,
      category: row.overrides?.category || row.recipientMatch.suggestedCategory,
      amount: row.overrides?.amount || row.parsed.amount,
      recurringId: row.overrides?.recurringId || row.recurringMatch.recurringExpenseId,
    });
  };

  const saveEdit = (id: string) => {
    onEdit(id, editValues);
    setEditingRow(null);
    setEditValues(undefined);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditValues(undefined);
  };

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "bg-green-50 hover:bg-green-100 border-green-200";
      case "medium":
        return "bg-yellow-50 hover:bg-yellow-100 border-yellow-200";
      case "low":
        return "bg-red-50 hover:bg-red-100 border-red-200";
    }
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            Low
          </Badge>
        );
    }
  };

  const pendingRows = rows.filter((r) => r.status === "pending");
  const acceptedRows = rows.filter((r) => r.status === "accepted");
  const rejectedRows = rows.filter((r) => r.status === "rejected");

  const stats = {
    total: rows.length,
    pending: pendingRows.length,
    accepted: acceptedRows.length,
    rejected: rejectedRows.length,
    highConfidence: rows.filter((r) => r.recipientMatch.confidence === "high").length,
    mediumConfidence: rows.filter((r) => r.recipientMatch.confidence === "medium").length,
    lowConfidence: rows.filter((r) => r.recipientMatch.confidence === "low").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {pendingRows.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <input
            type="checkbox"
            checked={selectedRows.size === pendingRows.length && pendingRows.length > 0}
            onChange={toggleAllRows}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">
            {selectedRows.size > 0 ? `${selectedRows.size} selected` : "Select all"}
          </span>
          {selectedRows.size > 0 && (
            <>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onAccept(Array.from(selectedRows));
                  setSelectedRows(new Set());
                }}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Check className="mr-1 h-4 w-4" />
                Accept Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onReject(Array.from(selectedRows));
                  setSelectedRows(new Set());
                }}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <X className="mr-1 h-4 w-4" />
                Reject Selected
              </Button>
            </>
          )}
        </div>
      )}

      {/* Validation Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isEditing = editingRow === row.id;
                  const isPending = row.status === "pending";
                  const confidenceColor = getConfidenceColor(row.recipientMatch.confidence);

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "transition-colors",
                        isPending && confidenceColor,
                        row.status === "accepted" && "bg-green-50/50",
                        row.status === "rejected" && "bg-red-50/50 opacity-60"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell>
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm">
                        {row.parsed.timestamp
                          ? new Date(row.parsed.timestamp).toLocaleDateString()
                          : "N/A"}
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        {isEditing && editValues ? (
                          <Input
                            type="number"
                            value={editValues.amount ?? 0}
                            onChange={(e) =>
                              setEditValues({ ...editValues, amount: parseFloat(e.target.value) })
                            }
                            className="h-8 w-24"
                          />
                        ) : (
                          <span className="font-semibold">
                            KSh {(row.overrides?.amount || row.parsed.amount).toLocaleString()}
                          </span>
                        )}
                      </TableCell>

                      {/* Recipient */}
                      <TableCell>
                        {isEditing && editValues ? (
                          <Input
                            value={editValues.recipient ?? ""}
                            onChange={(e) =>
                              setEditValues({ ...editValues, recipient: e.target.value })
                            }
                            className="h-8 w-40"
                          />
                        ) : (
                          <div>
                            <p className="font-medium">
                              {row.overrides?.recipient || row.recipientMatch.recipientName}
                            </p>
                            {row.parsed.phoneNumber && (
                              <p className="text-xs text-muted-foreground">
                                {row.parsed.phoneNumber}
                              </p>
                            )}
                            {row.recipientMatch.matchedBy !== "none" && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {row.recipientMatch.matchedBy}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {isEditing && editValues ? (
                          <Select
                            value={editValues.category ?? ""}
                            onValueChange={(value) =>
                              setEditValues({ ...editValues, category: value })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div>
                            <p className="text-sm">
                              {row.overrides?.category ||
                                row.recipientMatch.suggestedCategory ||
                                "Uncategorized"}
                            </p>
                            {row.recipientMatch.categoryConfidence && (
                              <p className="text-xs text-muted-foreground">
                                {Math.round(row.recipientMatch.categoryConfidence)}% confident
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Recurring */}
                      <TableCell>
                        {row.recurringMatch.recurringExpenseId ? (
                          <div>
                            <Badge variant="secondary" className="text-xs">
                              🔄 {row.recurringMatch.expenseName}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Score: {row.recurringMatch.matchScore}/100
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No match</span>
                        )}
                      </TableCell>

                      {/* Confidence */}
                      <TableCell>
                        {getConfidenceBadge(row.recipientMatch.confidence)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEdit(row.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : isPending ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAccept([row.id])}
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onReject([row.id])}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline">
                            {row.status === "accepted" ? "Accepted" : "Rejected"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {(acceptedRows.length > 0 || rejectedRows.length > 0) && (
        <div className="flex justify-end gap-2">
          <Button onClick={onSave} size="lg" className="min-w-32">
            Save {acceptedRows.length} Expense{acceptedRows.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
