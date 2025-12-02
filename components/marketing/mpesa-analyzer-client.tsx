"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  TrendingDown,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  analyzeSMSMessages,
  analyzeStatementPDF,
  type SpendingAnalysis,
} from "@/lib/spending-analyzer";
import Link from "next/link";

export function MPesaAnalyzerClient() {
  const [smsText, setSmsText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SpendingAnalysis | null>(null);

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
    } catch (err) {
      console.error("Error analyzing SMS:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze SMS messages"
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
      const pdfText = await extractTextFromPDF(pdfFile);

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

  return (
    <div className="max-w-4xl mx-auto">
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
                  <p className="text-sm text-primary">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>
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
                  Top Category
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {results.topCategory}
                </div>
                <p className="text-xs text-muted-foreground">
                  KSh {Math.round(results.topSpending).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          </Card>

          {/* CTA */}
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Want to Track Ongoing?</h3>
              <p className="text-lg opacity-90">
                Sign up for MONEE and track your expenses, manage debts,
                build savings — all in one simple app.
              </p>
              <p className="text-sm opacity-75">
                Free to download. 7-day free trial. Then KSh 999 one-time
                payment — worth KSh 10,000-15,000. Best deal ever.
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
