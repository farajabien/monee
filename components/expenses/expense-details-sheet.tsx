"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  User,
  Tag,
  FileText,
  Phone,
  Hash,
  DollarSign,
  Repeat,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { Expense, ParsedExpenseData } from "@/types";

interface ExpenseDetailsSheetProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDetailsSheet({
  expense,
  open,
  onOpenChange,
}: ExpenseDetailsSheetProps) {
  const { formatCurrency } = useCurrency();

  if (!expense) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExpenseTypeLabel = (type?: string) => {
    const labels = {
      send: "Sent Money",
      receive: "Received Money",
      buy: "Purchase",
      withdraw: "Withdrawal",
      deposit: "Deposit",
    } as const;
    return labels[type as keyof typeof labels] || type || "Transaction";
  };

  const getExpenseTypeBadge = (type?: string) => {
    const variants = {
      send: "destructive",
      receive: "default",
      buy: "secondary",
      withdraw: "outline",
      deposit: "default",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {getExpenseTypeLabel(type)}
      </Badge>
    );
  };

  // Parse parsedData if it exists
  const parsedData = expense.parsedData as ParsedExpenseData | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Transaction Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Amount Section */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Amount</p>
            <p className="text-4xl font-bold text-destructive">
              {formatCurrency(expense.amount)}
            </p>
            <div className="flex justify-center mt-2">
              {getExpenseTypeBadge(expense.expenseType)}
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Recipient</span>
                </div>
                <span className="font-medium">{expense.recipient}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Category</span>
                </div>
                <Badge variant="secondary">{expense.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </div>
                <span className="font-medium">{formatDate(expense.date)}</span>
              </div>
            </CardContent>
          </Card>

          {/* M-Pesa Details */}
          {(expense.mpesaReference || parsedData?.reference) && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold mb-2">M-Pesa Details</h3>
                {expense.mpesaReference && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span>Reference</span>
                    </div>
                    <span className="font-mono text-sm">
                      {expense.mpesaReference}
                    </span>
                  </div>
                )}
                {parsedData?.phoneNumber && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </div>
                    <span className="font-mono text-sm">
                      {parsedData.phoneNumber}
                    </span>
                  </div>
                )}
                {parsedData?.transactionCost !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Transaction Fee
                    </span>
                    <span className="font-medium">
                      {formatCurrency(parsedData.transactionCost)}
                    </span>
                  </div>
                )}
                {parsedData?.balance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Balance After
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(parsedData.balance)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recurring Information */}
          {expense.isRecurring && (
            <Card className="border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                    Recurring Transaction
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This expense is linked to a recurring transaction
                </p>
                {expense.linkedRecurringId && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {expense.linkedRecurringId.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Raw Message */}
          {expense.rawMessage && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Original Message</h3>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-mono whitespace-pre-wrap break-words">
                    {expense.rawMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Notes */}
          {expense.notes && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{expense.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Parsed Data */}
          {parsedData && Object.keys(parsedData).length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Parsed Data</h3>
                <div className="space-y-2">
                  {Object.entries(parsedData)
                    .filter(
                      ([key]) =>
                        ![
                          "amount",
                          "recipient",
                          "reference",
                          "phoneNumber",
                          "transactionCost",
                          "balance",
                        ].includes(key)
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium">
                          {typeof value === "number"
                            ? value.toLocaleString()
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Created Date */}
          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            Created on {formatDate(expense.createdAt)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
