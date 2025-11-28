"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, Upload, FileText, Smartphone, Trash2 } from "lucide-react";
import {
  loadAnalyses,
  deleteAnalysis,
  clearAllAnalyses,
} from "@/lib/storage-utils";
import type { SavedAnalysis } from "@/types/year-analysis";
import { toast } from "sonner";

interface SavedAnalysesListProps {
  onLoad: (analysis: SavedAnalysis) => void;
}

export function SavedAnalysesList({ onLoad }: SavedAnalysesListProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = () => {
    const saved = loadAnalyses();
    setAnalyses(saved);
  };

  const handleDelete = (id: string) => {
    try {
      deleteAnalysis(id);
      loadSavedAnalyses();
      toast.success("Analysis deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete analysis");
      console.error(error);
    }
  };

  const handleClearAll = () => {
    try {
      clearAllAnalyses();
      loadSavedAnalyses();
      toast.success("All analyses cleared");
      setShowClearAll(false);
    } catch (error) {
      toast.error("Failed to clear analyses");
      console.error(error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInputMethodIcon = (method: string) => {
    switch (method) {
      case "pdf":
        return <Upload className="h-4 w-4" />;
      case "statement":
        return <FileText className="h-4 w-4" />;
      case "sms":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getInputMethodLabel = (method: string) => {
    switch (method) {
      case "pdf":
        return "PDF Upload";
      case "statement":
        return "Statement Text";
      case "sms":
        return "SMS Messages";
      default:
        return method;
    }
  };

  if (analyses.length === 0) {
    return null; // Don't show anything if no saved analyses
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Saved Analyses ({analyses.length})
              </CardTitle>
              <CardDescription>
                Your previously analyzed statements (saved locally in browser)
              </CardDescription>
            </div>
            {analyses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearAll(true)}
                className="text-red-500 hover:text-red-600"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="hover:border-primary transition-colors"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getInputMethodIcon(analysis.inputMethod)}
                      <span className="text-xs">
                        {getInputMethodLabel(analysis.inputMethod)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={() => setDeleteId(analysis.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div>
                    <p className="text-2xl font-bold">
                      {formatAmount(analysis.yearStats.totalSpent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analysis.yearStats.year} •{" "}
                      {analysis.yearStats.totalExpenses} expenses
                    </p>
                  </div>

                  {/* Date Range */}
                  <div className="text-xs text-muted-foreground">
                    <p>
                      {analysis.dateRange.start.toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      -{" "}
                      {analysis.dateRange.end.toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* File Name (if available) */}
                  {analysis.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      📄 {analysis.fileName}
                    </p>
                  )}

                  {/* Saved Date */}
                  <p className="text-xs text-muted-foreground">
                    Saved{" "}
                    {new Date(analysis.timestamp).toLocaleDateString("en-KE", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  {/* Load Button */}
                  <Button
                    onClick={() => {
                      onLoad(analysis);
                      toast.success("Analysis loaded!");
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Load Analysis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this saved analysis from your
              browser. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Saved Analyses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all {analyses.length} saved analyses
              from your browser. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
