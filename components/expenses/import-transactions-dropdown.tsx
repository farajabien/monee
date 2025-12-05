/**
 * ImportTransactionsDropdown Component
 *
 * Compact dropdown menu for importing transactions from different sources
 * Combines Import SMS and Import Statement into a single button to save space
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MessageSquare, FileText } from "lucide-react";
import { ImportSmsDialog } from "./import-sms-dialog";
import { ImportStatementDialog } from "./import-statement-dialog";
import type { ParsedExpenseData } from "@/types";

interface ImportTransactionsDropdownProps {
  onImport: (parsed: ParsedExpenseData[]) => void;
}

export function ImportTransactionsDropdown({
  onImport,
}: ImportTransactionsDropdownProps) {
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setSmsDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Import from SMS</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatementDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Import from Statement</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportSmsDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        onImport={(parsed) => {
          onImport(parsed);
          setSmsDialogOpen(false);
        }}
      />

      <ImportStatementDialog
        open={statementDialogOpen}
        onOpenChange={setStatementDialogOpen}
        onImport={(parsed) => {
          onImport(parsed);
          setStatementDialogOpen(false);
        }}
      />
    </>
  );
}
