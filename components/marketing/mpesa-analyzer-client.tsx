"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  TrendingDown,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Users,
  Save,
  History,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  analyzeSMSMessages,
  analyzeStatementPDF,
  type SpendingAnalysis,
  type RecipientSpending,
} from "@/lib/spending-analyzer";
import {
  saveExpenses,
  getAllExpenses,
  calculateStats,
  type AnalyzerExpense,
} from "@/lib/analyzer-storage";
import { toast } from "sonner";
import Link from "next/link";

// Lazy load Syncfusion PDF viewer to reduce initial bundle size
const PdfSyncfusionExtractor = lazy(
  () => import("@/components/marketing/pdf-syncfusion-extractor")
);

export function MPesaAnalyzerClient() {
  const [smsText, setSmsText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SpendingAnalysis | null>(null);
  const [savedAnalysesCount, setSavedAnalysesCount] = useState(0);
  const [totalAnalysesCount, setTotalAnalysesCount] = useState(847); // Social proof counter
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [useSyncfusionExtractor, setUseSyncfusionExtractor] = useState(false);

  // Load saved analyses count on mount
  useEffect(() => {
    const loadSavedCount = async () => {
      try {
        const expenses = await getAllExpenses();
        setSavedAnalysesCount(expenses.length > 0 ? 1 : 0);
      } catch (err) {
        console.error("Error loading saved analyses:", err);
      }
    };
    loadSavedCount();

    // Increment social proof counter periodically
    const interval = setInterval(() => {
      setTotalAnalysesCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeSMS = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = analyzeSMSMessages(smsText);

      if (analysis.transactionCount === 0) {
        setError(
          "No valid M-Pesa transactions found. Please check your SMS messages and try again."
        );
        setIsAnalyzing(false);
        return;
      }

      setResults(analysis);
      setAnalyzed(true);
      toast.success(`Analyzed ${analysis.transactionCount} transactions successfully!`);
    } catch (err) {
      console.error("Error analyzing SMS:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze SMS messages"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!results) return;

    setIsSaving(true);
    try {
      // Convert transactions to AnalyzerExpense format
      const expenses: AnalyzerExpense[] = results.transactions
        .filter(t => t.type === "spend")
        .map(t => ({
          id: `${t.timestamp}-${t.recipient}-${t.amount}`,
          amount: t.amount,
          recipient: t.recipient,
          date: t.timestamp,
          category: t.category,
          rawMessage: t.description,
          expenseType: "send",
          parsedAt: Date.now(),
        }));

      await saveExpenses(expenses);
      setSavedAnalysesCount(prev => prev + 1);
      toast.success("Analysis saved! View it anytime in your browser.");
    } catch (err) {
      console.error("Error saving analysis:", err);
      toast.error("Failed to save analysis. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextExtracted = async (pdfText: string) => {
    try {
      if (!pdfText || pdfText.trim().length === 0) {
        setError(
          "Could not extract text from PDF. Please ensure it's a valid M-Pesa statement."
        );
        setIsAnalyzing(false);
        return;
      }

      const analysis = analyzeStatementPDF(pdfText);

      if (analysis.transactionCount === 0) {
        setError(
          "No valid transactions found in the PDF. Please ensure it's a M-Pesa statement."
        );
        setIsAnalyzing(false);
        return;
      }

      setResults(analysis);
      setAnalyzed(true);
      toast.success(`Analyzed ${analysis.transactionCount} transactions successfully!`);
    } catch (err) {
      console.error("Error analyzing PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze PDF. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePDF = async () => {
    if (!pdfFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Use Syncfusion extractor if enabled, otherwise use pdf-utils
      if (useSyncfusionExtractor) {
        // The Syncfusion component will call handleTextExtracted when ready
        return;
      }

      const pdfText = await extractTextFromPDF(pdfFile);
      await handleTextExtracted(pdfText);
    } catch (err) {
      console.error("Error analyzing PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze PDF. Please try again."
      );
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Social Proof Banner */}
      <div className="mb-6 text-center">
        <Badge variant="secondary" className="text-sm">
          <Users className="h-3 w-3 mr-2" />
          {totalAnalysesCount.toLocaleString()}+ Kenyans analyzed their spending this week
        </Badge>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload or Paste Your Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">
                <Upload className="h-4 w-4 mr-2" />
                PDF Statement
              </TabsTrigger>
              <TabsTrigger value="sms">
                <FileText className="h-4 w-4 mr-2" />
                Paste SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-semibold">
                    Drop your M-Pesa PDF statement here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPdfFile(e.target.files[0]);
                      setShowPdfPreview(false);
                    }
                  }}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <Button variant="outline" asChild>
                    <span>Choose PDF File</span>
                  </Button>
                </label>
                {pdfFile && (
                  <div className="space-y-3">
                    <p className="text-sm text-primary">
                      Selected: {pdfFile.name}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                      >
                        {showPdfPreview ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Show Preview
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUseSyncfusionExtractor(!useSyncfusionExtractor)}
                      >
                        {useSyncfusionExtractor ? "📄 Standard" : "🚀 Enhanced"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* PDF Preview */}
              {pdfFile && showPdfPreview && (
                <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    }
                  >
                    <PdfSyncfusionExtractor
                      file={pdfFile}
                      onTextExtracted={useSyncfusionExtractor && isAnalyzing ? handleTextExtracted : () => {}}
                      hidden={false}
                    />
                  </Suspense>
                </div>
              )}
              
              <Button
                onClick={handleAnalyzePDF}
                disabled={!pdfFile || isAnalyzing}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze My Spending
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your M-Pesa SMS messages here... You can paste multiple messages at once."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Copy all your M-Pesa messages from the last few days
                  and paste them here
                </p>
              </div>
              <Button
                onClick={handleAnalyzeSMS}
                disabled={!smsText.trim() || isAnalyzing}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze My Spending
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analyzed && results && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Your Spending Breakdown</h2>
            <p className="text-sm text-muted-foreground">
              {results.dateRange.days} day
              {results.dateRange.days > 1 ? "s" : ""} analyzed •{" "}
              {new Date(results.dateRange.start).toLocaleDateString()} -{" "}
              {new Date(results.dateRange.end).toLocaleDateString()}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAnalysis}
              disabled={isSaving}
              className="mt-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3 w-3" />
                  Save This Analysis
                </>
              )}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KSh {Math.round(results.totalSpent).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.transactionCount} transaction
                  {results.transactionCount > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg per Day
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KSh {Math.round(results.avgDailySpend).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Daily burn rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Recipient
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate" title={results.topRecipient}>
                  {results.topRecipient}
                </div>
                <p className="text-xs text-muted-foreground">
                  KSh {Math.round(results.topRecipientSpending).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recipient Breakdown - PRIMARY */}
          <Card>
            <CardHeader>
              <CardTitle>Who You Spent With Most</CardTitle>
              <p className="text-sm text-muted-foreground">
                {results.uniqueRecipientCount} unique recipient{results.uniqueRecipientCount > 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.recipients.slice(0, 10).map((recipient) => (
                <Accordion key={recipient.normalizedName} type="single" collapsible>
                  <AccordionItem value="details" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex-1 flex items-center justify-between pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-medium">{recipient.recipient}</div>
                            <div className="text-xs text-muted-foreground">
                              {recipient.transactionCount} transaction{recipient.transactionCount > 1 ? "s" : ""}
                              {recipient.primaryCategory && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  {recipient.primaryCategory}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            KSh {Math.round(recipient.totalAmount).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {recipient.percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="pt-2 space-y-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${recipient.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg: KSh {Math.round(recipient.averageAmount).toLocaleString()} per transaction
                        </div>
                        {recipient.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {recipient.categories.map(cat => (
                              <Badge key={cat} variant="secondary" className="text-[10px]">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          {/* Category Breakdown - SECONDARY */}
          <Accordion type="single" collapsible>
            <AccordionItem value="categories">
              <Card>
                <CardHeader>
                  <AccordionTrigger className="hover:no-underline">
                    <CardTitle>Spending by Category</CardTitle>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-4">
                    {results.categories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {category.name} ({category.count})
                          </span>
                          <span className="text-muted-foreground">
                            KSh {Math.round(category.amount).toLocaleString()} (
                            {category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Insights Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold">💡 Quick Insights</h3>
              <div className="space-y-2 text-sm">
                <p>
                  📊 You spent <strong>KSh {Math.round(results.avgDailySpend).toLocaleString()}</strong> per day on average
                </p>
                <p>
                  🎯 Your top expense was <strong>{results.topRecipient}</strong> at{" "}
                  <strong>KSh {Math.round(results.topRecipientSpending).toLocaleString()}</strong>
                </p>
                <p>
                  👥 You transacted with <strong>{results.uniqueRecipientCount} different recipients</strong>
                </p>
                {results.categories.length > 0 && (
                  <p>
                    🏷️ Most spending was in <strong>{results.topCategory}</strong> category
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Want Automatic Tracking?</h3>
                <p className="text-lg opacity-90">
                  Sign up for MONEE and get ongoing expense tracking, debt management,
                  savings goals, and smart insights — all automatically synced.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 py-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">📱</div>
                  <p className="text-sm opacity-90">Works offline as PWA</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">🔄</div>
                  <p className="text-sm opacity-90">Auto-sync across devices</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">🎯</div>
                  <p className="text-sm opacity-90">Set & track goals</p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm opacity-75">
                  Free to download • 7-day free trial • Then KSh 999 one-time payment<br/>
                  <span className="font-semibold">(Worth KSh 10,000-15,000 - Best deal ever!)</span>
                </p>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Download MONEE - Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
