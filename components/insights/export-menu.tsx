"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Save, CheckCircle2 } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { saveAnalysis, getStorageInfo } from "@/lib/storage-utils";
import type { YearStats } from "@/types/year-analysis";
import { toast } from "sonner";

interface ExportMenuProps {
  yearStats: YearStats;
  formatAmount: (amount: number) => string;
  showSave?: boolean; // Show "Save to Browser" option (for free analyzer)
  inputMethod?: "pdf" | "statement" | "sms";
  fileName?: string;
}

export function ExportMenu({
  yearStats,
  formatAmount,
  showSave = false,
  inputMethod = "pdf",
  fileName,
}: ExportMenuProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleExportCSV = () => {
    try {
      exportToCSV(yearStats, formatAmount);
      toast.success("CSV exported successfully!");
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(yearStats, formatAmount);
      toast.success("Opening print dialog...");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const handleSaveToBrowser = () => {
    try {
      const storageInfo = getStorageInfo();

      if (!storageInfo.canSaveMore) {
        toast.error(
          `Maximum ${storageInfo.count} analyses saved. Please delete some before saving more.`
        );
        return;
      }

      saveAnalysis(yearStats, inputMethod, fileName);
      setIsSaved(true);
      toast.success("Analysis saved to browser!");

      // Reset saved state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      toast.error("Failed to save analysis");
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export & Save
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
          <FileText className="h-4 w-4" />
          Export to CSV
          <span className="ml-auto text-xs text-muted-foreground">
            Excel compatible
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Export to PDF
          <span className="ml-auto text-xs text-muted-foreground">
            Print friendly
          </span>
        </DropdownMenuItem>

        {showSave && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Browser Storage</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleSaveToBrowser}
              disabled={isSaved}
              className="gap-2"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save to Browser
                  <span className="ml-auto text-xs text-muted-foreground">
                    Local only
                  </span>
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
