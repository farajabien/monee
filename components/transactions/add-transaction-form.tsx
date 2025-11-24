"use client";

import { useState, useMemo } from "react";
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
import { parseStatementText, convertStatementToMessages, extractTextFromPDF } from "@/lib/statement-parser";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { ManualTransactionDialog } from "@/components/transactions/manual-transaction-dialog";
import type { Transaction, Category } from "@/types";

export default function AddTransactionForm() {
  const user = db.useUser();
  const [messages, setMessages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("auto-match");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMethod, setInputMethod] = useState<"sms" | "pdf">("pdf");
  const [previewTransactions, setPreviewTransactions] = useState<Array<{
    amount: number;
    recipient: string;
    date: number;
    category: string;
    rawMessage: string;
  }>>([]);

  // Fetch existing transactions for recipient matching
  const { data: transactionsData } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        limit: 1000,
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const existingTransactions: Transaction[] = useMemo(
    () => transactionsData?.transactions || [],
    [transactionsData]
  );

  const recipients = transactionsData?.recipients || [];

  // Helper to get display name (nickname or original)
  const getDisplayName = (originalName: string) => {
    const recipient = recipients.find((r) => r.originalName === originalName);
    return recipient?.nickname || originalName;
  };

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "user.id": user.id },
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
      let allMessages: string[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        console.log(`Processing file ${i + 1} of ${uploadedFiles.length}: ${file.name}`);
        
        const pdfText = await extractTextFromPDF(file);
        const statementTransactions = parseStatementText(pdfText);
        const messagesFromPDF = convertStatementToMessages(statementTransactions);
        
        allMessages = [...allMessages, ...messagesFromPDF];
        console.log(`File ${i + 1}: Extracted ${messagesFromPDF.length} transactions`);
      }
      
      setMessages(allMessages.join('\n'));
      console.log(`Total: ${allMessages.length} transactions from ${uploadedFiles.length} file(s)`);
    } catch (error) {
      console.error("PDF processing failed:", error);
      alert(`Failed to process PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-process PDFs when files are uploaded
  useMemo(() => {
    if (uploadedFiles.length > 0 && inputMethod === "pdf") {
      processPDFs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles, inputMethod]);

  // Parse and preview transactions when messages change
  useMemo(() => {
    if (!messages.trim()) {
      setPreviewTransactions([]);
      return;
    }

    const messageLines = messages
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed = [];
    for (const message of messageLines) {
      try {
        const data = parseMpesaMessage(message);
        // Auto-match category based on recipient
        const autoCategory = data.recipient
          ? findMostCommonCategoryForRecipient(
              data.recipient,
              existingTransactions
            )
          : null;
        
        parsed.push({
          amount: data.amount,
          recipient: data.recipient || "Unknown",
          date: data.timestamp || Date.now(),
          category: autoCategory || selectedCategory || "Uncategorized",
          rawMessage: message,
        });
      } catch (error) {
        console.error("Failed to parse message:", message, error);
      }
    }
    setPreviewTransactions(parsed);
  }, [messages, existingTransactions, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages.trim() || previewTransactions.length === 0) return;

    setIsSubmitting(true);
    try {
      const messageLines = messages
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const message of messageLines) {
        try {
          const parsed = parseMpesaMessage(message);
          
          // Auto-match category based on recipient, fallback to selected or uncategorized
          let category = (selectedCategory && selectedCategory !== "auto-match") ? selectedCategory : "Uncategorized";
          if (parsed.recipient) {
            const autoCategory = findMostCommonCategoryForRecipient(
              parsed.recipient,
              existingTransactions
            );
            if (autoCategory) {
              category = autoCategory;
            }
          }

          await db.transact(
            db.tx.transactions[id()]
              .update({
                amount: parsed.amount,
                recipient: parsed.recipient || "",
                date: parsed.timestamp || Date.now(),
                category,
                rawMessage: message,
                parsedData: parsed,
                createdAt: Date.now(),
              })
              .link({ user: user.id })
          );
        } catch (error) {
          console.error("Failed to parse message:", message, error);
        }
      }

      setMessages("");
      setSelectedCategory("auto-match");
      setPreviewTransactions([]);
    } catch (error) {
      console.error("Error adding transactions:", error);
      alert("Failed to add transactions. Please try again.");
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
          <h3 className="text-lg font-semibold">Add Transactions</h3>
          <p className="text-sm text-muted-foreground">Paste M-Pesa messages or add manually</p>
        </div>
        <ManualTransactionDialog />
      </div>

       <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "sms" | "pdf")}>
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
                          setUploadedFiles(prev => [...prev, ...files]);
                        }
                      }}
                      className="hidden"
                      id="pdf-upload-transactions"
                    />
                    <label htmlFor="pdf-upload-transactions">
                      <Button variant="outline" className="cursor-pointer" asChild type="button">
                        <span>Choose PDF File(s)</span>
                      </Button>
                    </label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}):</p>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
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
              <Label htmlFor="category-select">
                Default Category (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Will be used for transactions without auto-matched categories
              </p>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

            {previewTransactions.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Preview ({previewTransactions.length} transaction
                  {previewTransactions.length !== 1 ? "s" : ""})
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(() => {
                    // Group by date
                    const grouped = previewTransactions.reduce((acc, tx) => {
                      const dateKey = new Date(tx.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(tx);
                      return acc;
                    }, {} as Record<string, typeof previewTransactions>);

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
                              <p className="font-medium">{getDisplayName(tx.recipient)}</p>
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

            <Button
              type="submit"
              disabled={isSubmitting || !messages.trim() || previewTransactions.length === 0}
            >
              {isSubmitting
                ? "Adding..."
                : `Add ${previewTransactions.length} Transaction${previewTransactions.length !== 1 ? "s" : ""}`}
            </Button>
          </form>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}

