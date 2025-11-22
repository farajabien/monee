"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Download,
  Calendar,
  Users,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import {
  saveTransactions,
  getAllTransactions,
  clearAllTransactions,
  calculateStats,
  exportToJSON,
  exportToCSV,
  downloadFile,
  type AnalyzerTransaction,
  type AnalyzerStats,
} from "@/lib/analyzer-storage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AnalyzerPage() {
  const [messages, setMessages] = useState("");
  const [transactions, setTransactions] = useState<AnalyzerTransaction[]>([]);
  const [stats, setStats] = useState<AnalyzerStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Uncategorized");

  const categories = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Savings",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Education",
    "Personal Care",
    "Uncategorized",
  ];

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load transactions from IndexedDB on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const loaded = await getAllTransactions();
      setTransactions(loaded);
      if (loaded.length > 0) {
        setStats(calculateStats(loaded));
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!messages.trim()) {
      setError("Please paste some M-Pesa messages first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const messageLines = messages
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const parsed: AnalyzerTransaction[] = [];
      const failed: string[] = [];

      for (const message of messageLines) {
        try {
          const data = parseMpesaMessage(message);
          parsed.push({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: data.amount,
            recipient: data.recipient || "Unknown",
            date: data.timestamp || Date.now(),
            category: selectedCategory,
            rawMessage: message,
            transactionType: data.transactionType,
            parsedAt: Date.now(),
          });
        } catch {
          failed.push(message);
        }
      }

      if (parsed.length > 0) {
        await saveTransactions(parsed);
        const allTransactions = await getAllTransactions();
        setTransactions(allTransactions);
        setStats(calculateStats(allTransactions));
        setSuccess(
          `Successfully analyzed ${parsed.length} transaction${
            parsed.length !== 1 ? "s" : ""
          }!`
        );
        setMessages("");
      }

      if (failed.length > 0) {
        setError(
          `Could not parse ${failed.length} message${
            failed.length !== 1 ? "s" : ""
          }. Make sure they are valid M-Pesa messages.`
        );
      }
    } catch {
      setError("Failed to analyze transactions. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete all transactions?")) {
      try {
        await clearAllTransactions();
        setTransactions([]);
        setStats(null);
        setSuccess("All transactions cleared!");
      } catch {
        setError("Failed to clear transactions");
      }
    }
  };

  const handleExportJSON = () => {
    const json = exportToJSON(transactions);
    downloadFile(json, "monee-analyzer-export.json", "application/json");
    setSuccess("Exported to JSON!");
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(transactions);
    downloadFile(csv, "monee-analyzer-export.csv", "text/csv");
    setSuccess("Exported to CSV!");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/landing" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Image
              src="/AppImages/money-bag.png"
              alt="MONEE"
              width={32}
              height={32}
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <span className="font-bold text-base sm:text-xl">MONEE</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex text-xs">Free Analyzer</Badge>
            <Link href="/landing" className="hidden sm:block">
              <Button variant="ghost" size="sm">Back to Home</Button>
            </Link>
            <Link href="/login">
              <Button variant="default" size="sm" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Get Full App</span>
                <span className="sm:hidden">Get App</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Free M-Pesa Transaction Analyzer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Analyze your M-Pesa spending behavior. 100% offline and private —
            your data never leaves your device.
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Input Section */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mpesa-messages" className="text-sm sm:text-base">
                  Paste M-Pesa Messages
                </Label>
                <ScrollArea className="h-[200px] sm:h-[250px] rounded-md border">
                  <Textarea
                    id="mpesa-messages"
                    placeholder={`TKLPNAO4DP Confirmed. Ksh27.00 sent to SAFARICOM DATA BUNDLES...\nTKLPNAO6ZG Confirmed. Ksh100.00 sent to DORNALD OWUOR...\n\nPaste multiple messages here (one per line)`}
                    value={messages}
                    onChange={(e) => setMessages(e.target.value)}
                    className="min-h-[180px] sm:min-h-[230px] font-mono text-xs sm:text-sm border-0 resize-none focus-visible:ring-0"
                  />
                </ScrollArea>
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-sm flex-1">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing || !messages.trim()}
                  className="text-sm sm:text-base"
                  size="default"
                >
                  {isProcessing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>

              {transactions.length > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="flex-1 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="flex-1 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex-1 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {stats && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Metrics */}
              <div className="flex items-center gap-4 sm:gap-8 p-4 sm:p-6 bg-muted/30 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap mb-1">
                    Total Spent
                  </p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">
                    {formatAmount(stats.totalAmount)}
                  </p>
                </div>

                <div className="h-10 sm:h-12 w-px bg-border flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap mb-1">
                    Transactions
                  </p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">
                    {stats.totalTransactions}
                  </p>
                </div>

                <div className="h-10 sm:h-12 w-px bg-border flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap mb-1">
                    Recipients
                  </p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">
                    {Object.keys(stats.byRecipient).length}
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 sm:gap-6">
                {/* Top Recipients Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Recipients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Amount",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[400px] w-full"
                    >
                      <BarChart
                        data={Object.entries(stats.byRecipient)
                          .sort((a, b) => b[1].amount - a[1].amount)
                          .slice(0, 10)
                          .map(([, data]) => ({
                            name: data.displayName.length > 20 
                              ? data.displayName.slice(0, 20) + "..." 
                              : data.displayName,
                            amount: data.amount,
                            count: data.count,
                          }))}
                        layout="vertical"
                        margin={{ left: 100, right: 20, top: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={90} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatAmount(Number(value))}
                            />
                          }
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Spending by Date Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Spending by Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Amount Spent",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart
                        data={Object.entries(stats.byDate)
                          .sort((a, b) => {
                            const dateA = new Date(b[1].transactions[0].date).getTime();
                            const dateB = new Date(a[1].transactions[0].date).getTime();
                            return dateA - dateB;
                          })
                          .reverse()
                          .map(([dateKey, data]) => ({
                            date: dateKey,
                            amount: data.amount,
                            count: data.count,
                          }))}
                        margin={{ left: 20, right: 20, top: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatAmount(Number(value))}
                            />
                          }
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/landing" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <a href="mailto:support@monee.app" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>
          <div className="text-center mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} MONEE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
