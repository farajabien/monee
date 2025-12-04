"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText } from "lucide-react";
import { ImportSmsDialog } from "./import-sms-dialog";
import { ImportStatementDialog } from "./import-statement-dialog";
import { ExpenseImportValidation, type ValidationRow } from "./expense-import-validation";
import { batchMatchRecipients } from "@/lib/recipient-matcher";
import { batchMatchRecurring } from "@/lib/recurring-matcher";
import type { ParsedExpenseData, Expense, RecurringTransaction } from "@/types";

interface ExpenseImportOrchestratorProps {
  existingExpenses: Expense[];
  recurringExpenses: RecurringTransaction[];
  categories: string[];
  onSaveExpenses: (expenses: Array<Expense & { id?: string }>) => Promise<void>;
}

export function ExpenseImportOrchestrator({
  existingExpenses,
  recurringExpenses,
  categories,
  onSaveExpenses,
}: ExpenseImportOrchestratorProps) {
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  const processImportedExpenses = (parsed: ParsedExpenseData[]) => {
    // Step 1: Match recipients
    const recipientMatches = batchMatchRecipients(parsed, existingExpenses);

    // Step 2: Match recurring expenses
    const recurringMatches = batchMatchRecurring(
      parsed.map((p, i) => ({
        parsed: p,
        matchedRecipientName: recipientMatches[i].recipientName,
        suggestedCategory: recipientMatches[i].suggestedCategory,
      })),
      recurringExpenses
    );

    // Step 3: Create validation rows
    const rows: ValidationRow[] = parsed.map((p, i) => ({
      id: crypto.randomUUID(),
      parsed: p,
      recipientMatch: recipientMatches[i],
      recurringMatch: recurringMatches[i],
      status: "pending",
    }));

    setValidationRows(rows);
    setShowValidation(true);
  };

  const handleAccept = (ids: string[]) => {
    setValidationRows((prev) =>
      prev.map((row) =>
        ids.includes(row.id) ? { ...row, status: "accepted" as const } : row
      )
    );
  };

  const handleReject = (ids: string[]) => {
    setValidationRows((prev) =>
      prev.map((row) =>
        ids.includes(row.id) ? { ...row, status: "rejected" as const } : row
      )
    );
  };

  const handleEdit = (id: string, overrides: ValidationRow["overrides"]) => {
    setValidationRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, status: "edited" as const, overrides }
          : row
      )
    );
  };

  const handleSave = async () => {
    const acceptedRows = validationRows.filter((r) => r.status === "accepted" || r.status === "edited");

    const expensesToSave = acceptedRows.map((row) => {
      const recipient = row.overrides?.recipient || row.recipientMatch.recipientName;
      const category = row.overrides?.category || row.recipientMatch.suggestedCategory || "Uncategorized";
      const amount = row.overrides?.amount || row.parsed.amount;

      return {
        id: crypto.randomUUID(),
        amount,
        recipient,
        category,
        date: row.parsed.timestamp || Date.now(),
        rawMessage: row.parsed.reference || "",
        expenseType: row.parsed.expenseType || "send",
        parsedData: row.parsed,
        notes: row.parsed.phoneNumber ? `Phone: ${row.parsed.phoneNumber}` : undefined,
        mpesaReference: row.parsed.reference,
        linkedRecurringId: row.overrides?.recurringId || row.recurringMatch.recurringExpenseId,
        isRecurring: !!row.recurringMatch.recurringExpenseId,
        createdAt: Date.now(),
      };
    });

    try {
      await onSaveExpenses(expensesToSave);
      setValidationRows([]);
      setShowValidation(false);
    } catch (error) {
      console.error("Failed to save expenses:", error);
      alert("Failed to save expenses. Please try again.");
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? All pending imports will be lost.")) {
      setValidationRows([]);
      setShowValidation(false);
    }
  };

  if (showValidation && validationRows.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Review Imported Expenses</h2>
          <Button variant="outline" onClick={handleCancel}>
            Cancel Import
          </Button>
        </div>
        <ExpenseImportValidation
          rows={validationRows}
          categories={categories}
          onAccept={handleAccept}
          onReject={handleReject}
          onEdit={handleEdit}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSmsDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Import SMS
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatementDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Import Statement
        </Button>
      </div>

      <ImportSmsDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        onImport={processImportedExpenses}
      />

      <ImportStatementDialog
        open={statementDialogOpen}
        onOpenChange={setStatementDialogOpen}
        onImport={processImportedExpenses}
      />
    </>
  );
}
