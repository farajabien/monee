"use client";

import { useState, useMemo } from "react";
// --- Matching Utility & Types ---
// --- Matching Utility & Types ---
type ParsedTx = {
  amount: number;
  recipient: string;
  date: number;
  category: string;
  rawMessage: string;
  reference?: string;
};
type ManualTx = Expense & { mpesaReference?: string };
type FlaggedDuplicate = { parsed: ParsedTx; matches: ManualTx[] };
type FlaggedAction = "add" | "merge" | "ignore";

function fuzzyMatchManualExpense(
  parsed: ParsedTx,
  manualTx: ManualTx
): boolean {
  // Strict: match by Mpesa reference if present
  if (manualTx.mpesaReference && parsed.reference) {
    return (
      manualTx.mpesaReference.trim().toUpperCase() ===
      parsed.reference.trim().toUpperCase()
    );
  }
  // Fuzzy: match by amount, date (within 2 days), and recipient (case-insensitive, contains)
  const amountMatch = Math.abs(parsed.amount - manualTx.amount) < 1;
  const dateMatch =
    Math.abs(
      new Date(parsed.date).getTime() - new Date(manualTx.date).getTime()
    ) <
    2 * 24 * 60 * 60 * 1000;
  const rec1 = (parsed.recipient || "").toLowerCase();
  const rec2 = (manualTx.recipient || "").toLowerCase();
  const recipientMatch =
    !!rec1 && !!rec2 && (rec1.includes(rec2) || rec2.includes(rec1));
  return Boolean(amountMatch && dateMatch && recipientMatch);
}
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, X } from "lucide-react";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import { findMostCommonCategoryForRecipient } from "@/lib/recipient-matcher";
import { parseStatementText } from "@/lib/statement-parser";
import { extractTextFromPDF } from "@/app/actions/parse-pdf";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { ManualExpenseDialog } from "@/components/expenses/manual-expense-dialog";
import type { Expense, Category } from "@/types";

export default function AddExpenseForm() {
  // Track user actions for flagged duplicates
  const { user } = db.useAuth();
  const [messages, setMessages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("auto-match");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMethod, setInputMethod] = useState<"sms" | "pdf">("pdf");
  const [previewExpenses, setPreviewExpenses] = useState<ParsedTx[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [flaggedDuplicates, setFlaggedDuplicates] = useState<
    FlaggedDuplicate[]
  >([]);
  const [flaggedActions, setFlaggedActions] = useState<
    Record<number, FlaggedAction>
  >({});

  // Fetch existing expenses for recipient matching
  const { data: expensesData } = db.useQuery({
    expenses: {
      $: {
        where: { "profile.user.id": user.id },
        limit: 1000,
      },
    },
    recipients: {
      $: {
        where: { "profile.user.id": user.id },
      },
    },
  });

  const existingExpenses: Expense[] = useMemo(
    () => expensesData?.expenses || [],
    [expensesData]
  );

  const recipients = expensesData?.recipients || [];

  // Helper to get display name (nickname or original)
  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r) => r.originalName === originalName);
    return recipient?.nickname || originalName;
  };

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "profile.user.id": user.id },
        order: { name: "asc" },
      },
    },
  });

  const categories: Category[] = (categoriesData?.categories || []).filter(
    (category) => category.isActive !== false
  );

  // Process PDF files
  const processPDFs = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const allMessages: string[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        console.log(
          `Processing file ${i + 1} of ${uploadedFiles.length}: ${file.name}`
        );

        const pdfText = await extractTextFromPDF(file);
        const statementExpenses = parseStatementText(pdfText);

        // Convert parsed statement expenses to M-Pesa message format
        const messagesFromPDF = statementExpenses.map((expense) => {
          const date = new Date(expense.timestamp);
          const dateStr = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          const timeStr = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return `${
            expense.description.split("-")[0] || "UNKNOWN"
          } Confirmed. Ksh${expense.amount.toFixed(2)} sent to ${
            expense.recipient
          } on ${dateStr} at ${timeStr}`;
        });

        allMessages.push(...messagesFromPDF);
        console.log(
          `File ${i + 1}: Extracted ${messagesFromPDF.length} expenses`
        );
      }

      setMessages(allMessages.join("\n"));
      console.log(
        `Total: ${allMessages.length} expenses from ${uploadedFiles.length} file(s)`
      );
    } catch (error) {
      console.error("PDF processing failed:", error);
      alert(
        `Failed to process PDFs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual analysis for PDFs - don't auto-process
  const handleAnalyzeStatement = async () => {
    setAnalysisComplete(false);
    await processPDFs();
    setAnalysisComplete(true);
  };

  // Parse and preview expenses when messages change, flag possible duplicates
  // Reset analysis state when files change or input method changes
  useMemo(() => {
    setAnalysisComplete(false);
    setPreviewExpenses([]);
    setFlaggedDuplicates([]);
    setFlaggedActions({});
  }, [uploadedFiles, inputMethod]);

  useMemo(() => {
    // For PDF mode, only parse after analysis is complete
    if (inputMethod === "pdf" && !analysisComplete) {
      return;
    }

    if (!messages.trim()) {
      setPreviewExpenses([]);
      setFlaggedDuplicates([]);
      setFlaggedActions({});
      return;
    }

    const messageLines = messages
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed = [];
    const flagged = [];
    for (const message of messageLines) {
      try {
        const data = parseMpesaMessage(message);
        // Auto-match category based on recipient
        const autoCategory = data.recipient
          ? findMostCommonCategoryForRecipient(data.recipient, existingExpenses)
          : null;
        const previewTx = {
          amount: data.amount,
          recipient: data.recipient || "Unknown",
          date: data.timestamp || Date.now(),
          category: autoCategory || selectedCategory || "Uncategorized",
          rawMessage: message,
          reference: data.reference,
        };
        // Check for possible duplicate with manual expenses
        const manualMatches = existingExpenses.filter(
          (tx) =>
            tx.rawMessage?.startsWith("Manual entry") &&
            fuzzyMatchManualExpense(previewTx, tx)
        );
        if (manualMatches.length > 0) {
          flagged.push({ parsed: previewTx, matches: manualMatches });
        }
        parsed.push(previewTx);
      } catch (error) {
        console.error("Failed to parse message:", message, error);
      }
    }
    setPreviewExpenses(parsed);
    setFlaggedDuplicates(flagged);
    // Default all flagged to 'add' (user can change)
    setFlaggedActions(
      flagged.reduce<Record<number, FlaggedAction>>((acc, _, i) => {
        acc[i] = "add";
        return acc;
      }, {})
    );
  }, [
    messages,
    existingExpenses,
    selectedCategory,
    inputMethod,
    analysisComplete,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages.trim() || previewExpenses.length === 0) return;

    setIsSubmitting(true);
    try {
      // Build a set of messages to skip or merge based on flaggedActions
      const flaggedToSkip = new Set<string>();
      const flaggedToMerge: { parsed: ParsedTx; matches: ManualTx[] }[] = [];
      flaggedDuplicates.forEach((dup, i) => {
        if (flaggedActions[i] === "ignore")
          flaggedToSkip.add(dup.parsed.rawMessage);
        if (flaggedActions[i] === "merge")
          flaggedToMerge.push({ parsed: dup.parsed, matches: dup.matches });
      });

      const messageLines = messages
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const message of messageLines) {
        // If flagged as ignore, skip
        if (flaggedToSkip.has(message)) continue;

        try {
          const parsed = parseMpesaMessage(message);
          // If flagged as merge, update the first matching manual expense
          const mergeIdx = flaggedToMerge.findIndex(
            (f) => f.parsed.rawMessage === message
          );
          if (mergeIdx !== -1) {
            const match = flaggedToMerge[mergeIdx].matches[0];
            await db.transact(
              db.tx.expenses[match.id].update({
                // Merge: update manual with parsed data
                amount: parsed.amount,
                recipient: parsed.recipient || "",
                date: parsed.timestamp || Date.now(),
                category: match.category,
                rawMessage: message,
                parsedData: parsed,
                mpesaReference: parsed.reference,
              })
            );
            continue;
          }

          // Otherwise, add as new
          let category =
            selectedCategory && selectedCategory !== "auto-match"
              ? selectedCategory
              : "Uncategorized";
          if (parsed.recipient) {
            const autoCategory = findMostCommonCategoryForRecipient(
              parsed.recipient,
              existingExpenses
            );
            if (autoCategory) {
              category = autoCategory;
            }
          }

          await db.transact(
            db.tx.expenses[id()]
              .update({
                amount: parsed.amount,
                recipient: parsed.recipient || "",
                date: parsed.timestamp || Date.now(),
                category,
                rawMessage: message,
                parsedData: parsed,
                mpesaReference: parsed.reference,
                createdAt: Date.now(),
              })
              .link({ profile: profile?.id || "" })
          );
        } catch (error) {
          console.error("Failed to parse message:", message, error);
        }
      }

      setMessages("");
      setSelectedCategory("auto-match");
      setPreviewExpenses([]);
    } catch (error) {
      console.error("Error adding expenses:", error);
      alert("Failed to add expenses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowAddCategoryDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Add Expenses</h3>
          <p className="text-sm text-muted-foreground">
            Paste M-Pesa messages or add manually
          </p>
        </div>
        <ManualExpenseDialog />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs
          value={inputMethod}
          onValueChange={(v) => setInputMethod(v as "sms" | "pdf")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              PDF Upload
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload M-Pesa Statement PDF(s)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium mb-1">Upload Statement PDF(s)</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select multiple PDFs for different date ranges
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setUploadedFiles((prev) => [...prev, ...files]);
                    }
                  }}
                  className="hidden"
                  id="pdf-upload-expenses"
                />
                <label htmlFor="pdf-upload-expenses">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    asChild
                    type="button"
                  >
                    <span>Choose PDF File(s)</span>
                  </Button>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Uploaded Files ({uploadedFiles.length}):
                  </p>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {isProcessing && (
                <div className="text-sm text-muted-foreground">
                  Processing {uploadedFiles.length} file(s)...
                </div>
              )}

              {/* Analyze Statement Button */}
              {uploadedFiles.length > 0 && !isProcessing && (
                <Button
                  type="button"
                  onClick={handleAnalyzeStatement}
                  className="w-full"
                  variant={analysisComplete ? "outline" : "default"}
                >
                  {analysisComplete
                    ? "✓ Analysis Complete - Re-analyze?"
                    : "📊 Analyze Statement"}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-messages">Paste M-Pesa Message(s)</Label>
              <Textarea
                id="mpesa-messages"
                placeholder="TKLPNAO4DP Confirmed. Ksh27.00 sent to SAFARICOM DATA BUNDLES for account SAFARICOM DATA BUNDLES on 21/11/25 at 12:33 PM...&#10;TKLPNAO6ZG Confirmed. Ksh100.00 sent to DORNALD OWUOR 0700377906 on 21/11/25 at 12:35 PM..."
                value={messages}
                onChange={(e) => setMessages(e.target.value)}
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="category-select">Default Category (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Will be used for expenses without auto-matched categories
          </p>
          <div className="flex gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category-select" className="flex-1">
                <SelectValue placeholder="Auto-match or select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-match">Auto-match</SelectItem>
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddCategoryDialog(true)}
            >
              + New
            </Button>
          </div>
        </div>

        {previewExpenses.length > 0 &&
          (inputMethod === "sms" || analysisComplete) && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">
                Preview ({previewExpenses.length} expense
                {previewExpenses.length !== 1 ? "s" : ""})
              </p>
              {flaggedDuplicates.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2 text-yellow-900 text-xs">
                  <b>Possible duplicates detected:</b>
                  <ul className="list-disc ml-4">
                    {flaggedDuplicates.map((dup, i) => (
                      <li key={i} className="mb-2">
                        <div>
                          <span>
                            Imported: <b>{dup.parsed.recipient}</b> Ksh{" "}
                            {dup.parsed.amount} on{" "}
                            {new Date(dup.parsed.date).toLocaleDateString(
                              "en-KE"
                            )}
                            <br />
                          </span>
                          <span>
                            Matches manual:{" "}
                            {dup.matches
                              .map(
                                (m) =>
                                  `${m.recipient} Ksh ${m.amount} (${new Date(
                                    m.date
                                  ).toLocaleDateString("en-KE")})`
                              )
                              .join(", ")}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <label>
                            <input
                              type="radio"
                              name={`flagged-action-${i}`}
                              value="add"
                              checked={flaggedActions[i] === "add"}
                              onChange={() =>
                                setFlaggedActions((a) => ({ ...a, [i]: "add" }))
                              }
                            />{" "}
                            Add as new
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`flagged-action-${i}`}
                              value="merge"
                              checked={flaggedActions[i] === "merge"}
                              onChange={() =>
                                setFlaggedActions((a) => ({
                                  ...a,
                                  [i]: "merge",
                                }))
                              }
                            />{" "}
                            Merge with manual
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`flagged-action-${i}`}
                              value="ignore"
                              checked={flaggedActions[i] === "ignore"}
                              onChange={() =>
                                setFlaggedActions((a) => ({
                                  ...a,
                                  [i]: "ignore",
                                }))
                              }
                            />{" "}
                            Ignore
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <span>
                    Choose what to do with each duplicate before adding.
                  </span>
                </div>
              )}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(() => {
                  // Group by date
                  const grouped = previewExpenses.reduce((acc, tx) => {
                    const dateKey = new Date(tx.date).toLocaleDateString(
                      "en-KE",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    );
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(tx);
                    return acc;
                  }, {} as Record<string, typeof previewExpenses>);

                  return Object.entries(grouped).map(([date, txs]) => (
                    <div key={date} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-2">
                        {date} ({txs.length})
                      </p>
                      {txs.map((tx, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between text-sm p-2 rounded bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {getDisplayName(tx.recipient)}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {tx.category}
                            </Badge>
                          </div>
                          <span className="font-semibold">
                            Ksh {tx.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

        {(inputMethod === "sms" || analysisComplete) && (
          <Button
            type="submit"
            disabled={
              isSubmitting || !messages.trim() || previewExpenses.length === 0
            }
          >
            {isSubmitting
              ? "Adding..."
              : `Import ${previewExpenses.length} Expense${
                  previewExpenses.length !== 1 ? "s" : ""
                }`}
          </Button>
        )}
      </form>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
