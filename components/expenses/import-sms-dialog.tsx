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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, AlertCircle } from "lucide-react";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import type { ParsedExpenseData } from "@/types";

interface ImportSmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (expenses: ParsedExpenseData[]) => void;
}

export function ImportSmsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportSmsDialogProps) {
  const [smsText, setSmsText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    if (!smsText.trim()) {
      setError("Please paste your M-Pesa SMS messages");
      return;
    }

    setParsing(true);
    setError(null);

    try {
      // Split by common SMS separators
      const messages = smsText
        .split(/\n\n+|\r\n\r\n+/)
        .map((msg) => msg.trim())
        .filter((msg) => msg.length > 0);

      const parsed: ParsedExpenseData[] = [];
      const failed: string[] = [];

      for (const message of messages) {
        try {
          const result = parseMpesaMessage(message);
          if (result) {
            // Only include "send" and "buy" expenses (not "receive", "withdraw", "deposit")
            if (result.expenseType === "send" || result.expenseType === "buy") {
              parsed.push(result);
            } else {
              console.log("Skipping non-expense type:", result.expenseType, message.substring(0, 50));
            }
          } else {
            failed.push(message.substring(0, 50) + "...");
          }
        } catch (err) {
          console.error("Failed to parse message:", err, message.substring(0, 80));
          failed.push(message.substring(0, 50) + "...");
        }
      }

      if (parsed.length === 0) {
        const errorMsg = failed.length > 0 
          ? `No valid M-Pesa expenses found. ${messages.length} message(s) detected but could not be parsed. Check the browser console for details, or try copying the SMS text exactly as shown in your Messages app.`
          : "No valid M-Pesa expenses found. Only 'sent' and 'buy goods' transactions are imported. Received, withdraw, and deposit transactions are skipped.";
        setError(errorMsg);
        setParsing(false);
        return;
      }

      // Show warning if some failed
      if (failed.length > 0) {
        console.warn("Failed to parse some messages:", failed);
      }

      onImport(parsed);
      setSmsText("");
      onOpenChange(false);
    } catch (err) {
      setError("Failed to parse SMS messages. Please try again.");
      console.error("SMS parsing error:", err);
    } finally {
      setParsing(false);
    }
  };

  const exampleSms = `TL2PNBUD8H Confirmed. Ksh6,800.00 sent to DANIEL EXAMPLE 0712345678 on 4/12/25 at 12:25 PM New M-PESA balance is Ksh1,045.00. Transaction cost, Ksh53.00

TL5QCDEF9I Confirmed. Ksh1,500.00 paid to ZUKU FIBER for account 123456 on 3/12/25 at 10:30 AM New M-PESA balance is Ksh3,545.00. Transaction cost, Ksh0.00`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Import from M-Pesa SMS
          </DialogTitle>
          <DialogDescription>
            Paste your M-Pesa transaction messages below. The system will
            automatically extract expense details, match recipients, and suggest
            categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How to use:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Open your Messages app and find M-Pesa SMS</li>
                <li>
                  Copy one or multiple messages (separate with blank lines)
                </li>
                <li>Paste them in the text area below</li>
                <li>Click Import to review and validate expenses</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Text Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              M-Pesa SMS Messages
            </label>
            <Textarea
              value={smsText}
              onChange={(e) => {
                setSmsText(e.target.value);
                setError(null);
              }}
              placeholder={exampleSms}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {smsText.trim()
                ? `${
                    smsText.split(/\n\n+|\r\n\r\n+/).filter((m) => m.trim())
                      .length
                  } message(s) detected`
                : "Paste your messages here"}
            </p>
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
                setSmsText("");
                setError(null);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!smsText.trim() || parsing}
            >
              {parsing ? "Parsing..." : "Import & Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
