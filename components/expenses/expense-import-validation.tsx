"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Check,
  X,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  const [editValues, setEditValues] =
    useState<ValidationRow["overrides"]>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Extract available years and months from transaction data
  const { availableYears, availableMonths, currentYear } = useMemo(() => {
    const years = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();
    const now = new Date();
    const currentYr = now.getFullYear();

    rows.forEach((row) => {
      if (row.parsed.timestamp) {
        const date = new Date(row.parsed.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();

        years.add(year);

        if (!monthsByYear.has(year)) {
          monthsByYear.set(year, new Set());
        }
        monthsByYear.get(year)!.add(month);
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    return {
      availableYears: sortedYears,
      availableMonths: monthsByYear,
      currentYear: currentYr,
    };
  }, [rows]);

  // Auto-select current year if only one year available
  useEffect(() => {
    if (availableYears.length === 1) {
      setSelectedYear(availableYears[0].toString());
    } else if (availableYears.includes(currentYear)) {
      setSelectedYear(currentYear.toString());
    }
  }, [availableYears, currentYear]);

  // Filter rows based on selected year and month
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!row.parsed.timestamp) return true;

      const date = new Date(row.parsed.timestamp);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (selectedYear !== "all" && year !== parseInt(selectedYear)) {
        return false;
      }

      if (selectedMonth !== "all" && month !== parseInt(selectedMonth)) {
        return false;
      }

      return true;
    });
  }, [rows, selectedYear, selectedMonth]);

  // Get months for selected year
  const monthsForSelectedYear = useMemo(() => {
    if (selectedYear === "all") return [];

    const year = parseInt(selectedYear);
    const months = availableMonths.get(year);
    if (!months) return [];

    return Array.from(months).sort((a, b) => b - a);
  }, [selectedYear, availableMonths]);

  // Reset month selection when year changes
  useEffect(() => {
    if (selectedYear === "all") {
      setSelectedMonth("all");
    } else if (
      selectedMonth !== "all" &&
      !monthsForSelectedYear.includes(parseInt(selectedMonth))
    ) {
      setSelectedMonth("all");
    }
  }, [selectedYear, monthsForSelectedYear, selectedMonth]);

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
      recurringId:
        row.overrides?.recurringId || row.recurringMatch.recurringExpenseId,
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

  const pendingRows = filteredRows.filter((r) => r.status === "pending");
  const acceptedRows = filteredRows.filter((r) => r.status === "accepted");
  const rejectedRows = filteredRows.filter((r) => r.status === "rejected");

  // Calculate stats from ALL rows, not just filtered
  const allAcceptedRows = rows.filter((r) => r.status === "accepted");
  const allRejectedRows = rows.filter((r) => r.status === "rejected");

  const stats = {
    total: filteredRows.length,
    pending: pendingRows.length,
    accepted: acceptedRows.length,
    rejected: rejectedRows.length,
    highConfidence: filteredRows.filter(
      (r) => r.recipientMatch.confidence === "high"
    ).length,
    mediumConfidence: filteredRows.filter(
      (r) => r.recipientMatch.confidence === "medium"
    ).length,
    lowConfidence: filteredRows.filter(
      (r) => r.recipientMatch.confidence === "low"
    ).length,
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      {availableYears.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Filter by:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 1 && (
                <SelectItem value="all">All Years</SelectItem>
              )}
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                  {year === currentYear && " (Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedYear !== "all" && monthsForSelectedYear.length > 0 && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthsForSelectedYear.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {monthNames[month]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(selectedYear !== "all" || selectedMonth !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedYear("all");
                setSelectedMonth("all");
              }}
              className="h-9"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Stats Header - Compact Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-yellow-700">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-green-700">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xl font-bold text-green-600">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium text-red-700">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>
      {/* Save Button - Use all accepted rows, not just filtered */}
      {(allAcceptedRows.length > 0 || allRejectedRows.length > 0) && (
        <div className="flex justify-end gap-2">
          <Button onClick={onSave} size="lg" className="min-w-32">
            Save {allAcceptedRows.length} Expense
            {allAcceptedRows.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {pendingRows.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <input
            type="checkbox"
            checked={
              selectedRows.size === pendingRows.length && pendingRows.length > 0
            }
            onChange={toggleAllRows}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">
            {selectedRows.size > 0
              ? `${selectedRows.size} selected`
              : "Select all"}
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[120px]">Amount</TableHead>
            <TableHead className="min-w-[200px]">Recipient</TableHead>
            <TableHead className="w-[140px]">Category</TableHead>
            <TableHead className="w-[140px]">Recurring</TableHead>
            <TableHead className="w-[120px]">Confidence</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No expenses to validate.
              </TableCell>
            </TableRow>
          ) : (
            filteredRows.map((row) => {
              const isEditing = editingRow === row.id;
              const isPending = row.status === "pending";
              const confidenceColor = getConfidenceColor(
                row.recipientMatch.confidence
              );

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

                  {/* Amount */}
                  <TableCell>
                    {isEditing && editValues ? (
                      <Input
                        type="number"
                        value={editValues.amount ?? 0}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            amount: parseFloat(e.target.value),
                          })
                        }
                        className="h-8 w-full"
                      />
                    ) : (
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm whitespace-nowrap">
                          KSh{" "}
                          {(
                            row.overrides?.amount || row.parsed.amount
                          ).toLocaleString()}
                        </p>
                        {row.parsed.timestamp && (
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(row.parsed.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Recipient */}
                  <TableCell>
                    {isEditing && editValues ? (
                      <Input
                        value={editValues.recipient ?? ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            recipient: e.target.value,
                          })
                        }
                        className="h-8 w-full"
                      />
                    ) : (
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm leading-tight break-words">
                          {row.overrides?.recipient ||
                            row.recipientMatch.recipientName}
                        </p>
                        {row.parsed.phoneNumber && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {row.parsed.phoneNumber}
                          </p>
                        )}
                        {row.recipientMatch.matchedBy !== "none" && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] py-0 h-4"
                          >
                            {row.recipientMatch.matchedBy === "phone-exact"
                              ? "📞 Exact"
                              : row.recipientMatch.matchedBy === "phone-partial"
                              ? "📞 Partial"
                              : row.recipientMatch.matchedBy === "name-fuzzy"
                              ? "🔤 Name"
                              : row.recipientMatch.matchedBy}
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
                        <SelectTrigger className="h-8 w-full">
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
                        <p className="text-sm break-words">
                          {row.overrides?.category ||
                            row.recipientMatch.suggestedCategory ||
                            "Uncategorized"}
                        </p>
                        {row.recipientMatch.categoryConfidence && (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(row.recipientMatch.categoryConfidence)}%
                            confident
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
                      <span className="text-xs text-muted-foreground">
                        No match
                      </span>
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
