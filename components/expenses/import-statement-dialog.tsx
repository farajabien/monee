"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react";
import { parseStatementText } from "@/lib/statement-parser";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import type { ParsedExpenseData } from "@/types";

interface ImportStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (expenses: ParsedExpenseData[]) => void;
}

export function ImportStatementDialog({
  open,
  onOpenChange,
  onImport,
}: ImportStatementDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setParsing(true);
    setError(null);

    try {
      // Extract text from PDF using pdf-utils
      const text = await extractTextFromPDF(file);
      
      // Parse the extracted text into expenses
      const statementExpenses = parseStatementText(text);
      
      // Convert to ParsedExpenseData format
      const expenses: ParsedExpenseData[] = statementExpenses.map((se) => ({
        amount: se.amount,
        recipient: se.recipient,
        timestamp: se.timestamp,
        reference: se.description,
        expenseType: "send",
      }));

      if (expenses.length === 0) {
        setError("No expenses found in the statement. Please check the file format.");
        setParsing(false);
        return;
      }

      onImport(expenses);
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to parse statement. Please try again."
      );
      console.error("Statement parsing error:", err);
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import from M-Pesa Statement
          </DialogTitle>
          <DialogDescription>
            Upload your M-Pesa statement PDF to automatically extract and import expenses.
          </DialogDescription>
        </DialogHeader>

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>How to get your M-Pesa statement:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to M-Pesa menu → My Account → M-Pesa Statement</li>
              <li>Select the date range you want</li>
              <li>Enter your email and request the statement</li>
              <li>Download the PDF from your email</li>
              <li>Upload it here for instant expense import</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
         

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-medium">
                  Drag and drop your M-Pesa statement here
                </p>
                <p className="text-sm text-muted-foreground">or</p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Browse Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Only PDF files are supported
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setError(null);
                onOpenChange(false);
              }}
              disabled={parsing}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || parsing}>
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing Statement...
                </>
              ) : (
                "Import & Review"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
