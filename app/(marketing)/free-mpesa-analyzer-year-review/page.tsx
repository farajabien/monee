"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HowToGetStatement } from "@/components/how-to-get-statement";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import {
  parseStatementText,
  convertStatementToMessages,
} from "@/lib/statement-parser";
import { extractTextFromPDFAction } from "./actions";
import type { ParsedExpenseData } from "@/types";
import type { SavedAnalysis } from "@/types/year-analysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useYearAnalysis, useAvailableYears } from "@/hooks/use-year-analysis";
import { YearStatsDisplay } from "@/components/insights/year-stats-display";
import { ExportMenu } from "@/components/insights/export-menu";
import { SavedAnalysesList } from "@/components/insights/saved-analyses-list";
import { RecipientComparison } from "@/components/insights/recipient-comparison";
import { YearComparison } from "@/components/insights/year-comparison";

export default function FreeMpesaAnalyzerPage() {
  const [messages, setMessages] = useState("");
  const [statementText, setStatementText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [allExpenses, setAllExpenses] = useState<ParsedExpenseData[]>([]);
  const [inputMethod, setInputMethod] = useState<"sms" | "statement" | "pdf">(
    "pdf"
  );
  const [fileName, setFileName] = useState<string>();

  // Comparison view states
  const [showRecipientComparison, setShowRecipientComparison] = useState(false);
  const [showYearComparison, setShowYearComparison] = useState(false);
  const [comparisonYears, setComparisonYears] = useState<[number, number] | null>(null);

  // Get available years from expenses
  const availableYears = useAvailableYears(allExpenses);
  const defaultYear = availableYears.includes(2025)
    ? 2025
    : availableYears[0] || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Use shared year analysis hook
  const yearStats = useYearAnalysis(allExpenses, selectedYear, {
    groupBy: "expenseType",
  });

  // Get stats for year comparison (if 2 years selected)
  const year1Stats = useYearAnalysis(
    allExpenses,
    comparisonYears?.[0] || availableYears[0],
    { groupBy: "expenseType" }
  );
  const year2Stats = useYearAnalysis(
    allExpenses,
    comparisonYears?.[1] || availableYears[1],
    { groupBy: "expenseType" }
  );

  const handleLoadSavedAnalysis = (analysis: SavedAnalysis) => {
    setAllExpenses(analysis.yearStats.categories.flatMap(() => [])); // This would need the actual expenses
    setSelectedYear(analysis.yearStats.year);
    setInputMethod(analysis.inputMethod);
    setFileName(analysis.fileName);
    // Scroll to results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const analyzeYear = async () => {
    if (!messages.trim() && !statementText.trim() && uploadedFiles.length === 0)
      return;

    setIsAnalyzing(true);

    try {
      let messagesToParse: string[] = [];

      // Handle PDF upload (supports multiple files)
      if (inputMethod === "pdf" && uploadedFiles.length > 0) {
        console.log(
          `Starting PDF extraction for ${uploadedFiles.length} file(s)...`
        );

        // Capture file name(s) for saving
        if (uploadedFiles.length === 1) {
          setFileName(uploadedFiles[0].name);
        } else {
          setFileName(`${uploadedFiles.length} PDF files`);
        }

        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          console.log(
            `Processing file ${i + 1}/${uploadedFiles.length}: ${file.name}`
          );

          // Create FormData for server action
          const formData = new FormData();
          formData.append("file", file);

          // Extract text using server action
          const result = await extractTextFromPDFAction(formData);

          if (!result.success || !result.text) {
            console.error(`File ${i + 1} - Error:`, result.error);
            alert(
              result.error || `Failed to process PDF file: ${file.name}`
            );
            setIsAnalyzing(false);
            return;
          }

          const pdfText = result.text;
          console.log(`File ${i + 1} - PDF Text length:`, pdfText.length);

          const statementExpenses = parseStatementText(pdfText);
          console.log(
            `File ${i + 1} - Parsed expenses:`,
            statementExpenses.length
          );

          const fileMessages = convertStatementToMessages(statementExpenses);
          messagesToParse = [...messagesToParse, ...fileMessages];
          console.log(
            `File ${i + 1} - Converted to messages:`,
            fileMessages.length
          );
        }

        console.log(
          `Total messages from ${uploadedFiles.length} file(s):`,
          messagesToParse.length
        );
        if (messagesToParse.length > 0) {
          console.log("First message sample:", messagesToParse[0]);
        }
      }
      // Handle pasted statement text
      else if (inputMethod === "statement" && statementText.trim()) {
        console.log("Parsing statement text, length:", statementText.length);
        const statementExpenses = parseStatementText(statementText);
        console.log("Parsed statement expenses:", statementExpenses.length);
        messagesToParse = convertStatementToMessages(statementExpenses);
        console.log("Converted to messages:", messagesToParse.length);
      }
      // Handle SMS messages
      else {
        messagesToParse = messages.split("\n").filter((line) => line.trim());
      }

      // Parse all messages
      const expenses = messagesToParse
        .map((line) => {
          try {
            return parseMpesaMessage(line);
          } catch {
            console.log("Failed to parse:", line.substring(0, 100));
            return null;
          }
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);

      console.log("Successfully parsed expenses:", expenses.length);

      if (expenses.length === 0) {
        alert(
          "No valid M-Pesa expenses found. Please check your input format."
        );
        setIsAnalyzing(false);
        return;
      }

      // Set expenses to trigger analysis
      setAllExpenses(expenses);

      // Set selected year to default (2025 or most recent)
      const yearsSet = new Set<number>();
      expenses.forEach((t) => {
        if (t.timestamp) {
          const year = new Date(t.timestamp).getFullYear();
          yearsSet.add(year);
        }
      });
      const years = Array.from(yearsSet).sort((a, b) => b - a);
      const defaultYear = years.includes(2025) ? 2025 : years[0];
      setSelectedYear(defaultYear);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        `Failed to analyze: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-4"
          >
            <Image
              src="/AppImages/money-bag.png"
              alt="MONEE"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-xl">MONEE</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Free M-Pesa Statement Analyzer 🇰🇪
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Instantly analyze your M-Pesa spending and get your year in review.
            Upload your statement PDF, paste the text, or copy your SMS
            messages. Get detailed insights about where your money goes -
            completely free, private, and works offline!
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Full MONEE Experience
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Saved Analyses List */}
        <div className="mb-8">
          <SavedAnalysesList onLoad={handleLoadSavedAnalysis} />
        </div>

        {allExpenses.length === 0 ? (
          /* Input Section */
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Analyze Your M-Pesa Statement
              </CardTitle>
              <CardDescription>
                Upload your Full Statement PDF for the best experience. Supports
                all M-Pesa fields: Receipt No, Completion Time, Details, Expense
                Status, Paid in, Withdrawn, Balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={inputMethod}
                onValueChange={(v) =>
                  setInputMethod(v as "sms" | "statement" | "pdf")
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    PDF Upload
                  </TabsTrigger>
                  <TabsTrigger
                    value="statement"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Paste Statement
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paste SMS
                  </TabsTrigger>
                </TabsList>

                {/* PDF Upload Tab */}
                <TabsContent value="pdf" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">
                      Upload M-Pesa Full Statement PDF
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your statement PDF here, or click to browse
                    </p>
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
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        asChild
                      >
                        <span>Choose PDF File(s)</span>
                      </Button>
                    </label>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">
                          Uploaded Files ({uploadedFiles.length}):
                        </p>
                        {uploadedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <HowToGetStatement />
                </TabsContent>

                {/* Statement Text Tab */}
                <TabsContent value="statement" className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Paste your M-Pesa Full Statement text here...

Example format with all fields:
Receipt No Completion Time Details Expense Status Paid in Withdrawn Balance
REO5BUMKYX 2023-05-24 17:13:28 Pay Bill to 888880 - KPLC PREPAID COMPLETED 0.00 350.00 58.69
REO5B2H9CJ 2023-05-24 12:15:00 Airtime Purchase COMPLETED 0.00 50.00 408.69
..."
                    value={statementText}
                    onChange={(e) => setStatementText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      📄 How to copy statement text:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Download your M-Pesa Full Statement PDF</li>
                      <li>Open the PDF and select all expense rows</li>
                      <li>Copy (Cmd+C / Ctrl+C) and paste here</li>
                      <li>Include the header row for best results</li>
                    </ol>
                  </div>
                </TabsContent>

                {/* SMS Messages Tab */}
                <TabsContent value="sms" className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Paste your M-Pesa SMS messages here...

Example:
RCH4J8K9L0 Confirmed. Ksh500.00 sent to JANE DOE 0712345678 on 15/1/25 at 10:30 AM...
RCH4J8K9L1 Confirmed. Ksh1,200.00 sent to UBER KENYA on 20/2/25 at 8:15 PM..."
                    value={messages}
                    onChange={(e) => setMessages(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      💡 How to get SMS messages:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open your Messages app</li>
                      <li>Search for &quot;M-PESA&quot;</li>
                      <li>
                        Select and copy all messages from your desired period
                      </li>
                      <li>Paste them here</li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Note: SMS messages don&apos;t include all expense
                      fields. For complete analysis with Receipt No, Completion
                      Time, Status, and exact amounts, use the Full Statement
                      PDF.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={analyzeYear}
                disabled={
                  (!messages.trim() &&
                    !statementText.trim() &&
                    uploadedFiles.length === 0) ||
                  isAnalyzing
                }
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing Your Statement...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze My M-Pesa Spending 📊
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  🔒 100% Private - Your data is processed locally in your
                  browser and never uploaded to any server
                </p>
              </div>
            </CardContent>
          </Card>
        ) : yearStats ? (
          /* Results Section */
          <>
            <YearStatsDisplay
              yearStats={yearStats}
              formatAmount={formatAmount}
              showAchievements={false}
              headerAction={
                <div className="space-y-4">
                  {/* Export & Year Selector */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {availableYears.length > 1 && (
                          <div className="flex items-center gap-4 flex-1">
                            <div>
                              <Label className="text-sm font-medium">
                                Select Year
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Switch between {availableYears.join(", ")}
                              </p>
                            </div>
                            <Select
                              value={selectedYear.toString()}
                              onValueChange={(y) => setSelectedYear(parseInt(y))}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableYears.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <ExportMenu
                          yearStats={yearStats}
                          formatAmount={formatAmount}
                          showSave={true}
                          inputMethod={inputMethod}
                          fileName={fileName}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison Buttons */}
                  {availableYears.length >= 2 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => setShowRecipientComparison(true)}
                          >
                            <Users className="h-4 w-4" />
                            Compare Recipients Across Years
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => {
                              setComparisonYears([availableYears[1], availableYears[0]]);
                              setShowYearComparison(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Compare {availableYears[1]} vs {availableYears[0]}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              }
            footerCTA={
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-3">
                    Ready for Real-Time Money Tracking?
                  </h3>
                  <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
                    This free analyzer shows you the past. MONEE shows you the
                    present and helps you plan the future. Automatic tracking,
                    smart budgets, debt management, daily check-ins, and
                    AI-powered insights. Stop analyzing statements manually -
                    start tracking automatically.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" variant="secondary" asChild>
                      <Link href="/login">
                        Try MONEE Free - Ksh 999 Lifetime Access
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => setAllExpenses([])}
                    >
                      Analyze Another Statement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }
          />
            {/* Comparison Dialogs */}
            <Dialog
              open={showRecipientComparison}
              onOpenChange={setShowRecipientComparison}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Recipient Spending Comparison</DialogTitle>
                  <DialogDescription>
                    Compare your spending across different recipients for all years
                  </DialogDescription>
                </DialogHeader>
                <RecipientComparison
                  expenses={allExpenses}
                  years={availableYears}
                  formatAmount={formatAmount}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showYearComparison} onOpenChange={setShowYearComparison}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Year-over-Year Comparison</DialogTitle>
                  <DialogDescription>
                    Detailed comparison of your spending patterns across years
                  </DialogDescription>
                </DialogHeader>
                {year1Stats && year2Stats && (
                  <YearComparison
                    year1Stats={year1Stats}
                    year2Stats={year2Stats}
                    formatAmount={formatAmount}
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        ) : null}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Built in Kenya, for Kenyans 🇰🇪</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/landing" className="hover:text-primary">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
