"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Trash2,
  Download,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Image
              src="/AppImages/money-bag.png"
              alt="MONEE"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-xl">MONEE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Free Analyzer</Badge>
            <Link href="/landing">
              <Button variant="ghost">Back to Home</Button>
            </Link>
            <Link href="/login">
              <Button variant="default">
                Get Full App <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl font-bold">
            Free M-Pesa Transaction Analyzer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Paste M-Pesa Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-messages">
                    Paste one or multiple messages
                  </Label>
                  <ScrollArea className="h-[300px] rounded-md border">
                    <Textarea
                      id="mpesa-messages"
                      placeholder="TKLPNAO4DP Confirmed. Ksh27.00 sent to SAFARICOM DATA BUNDLES...&#10;TKLPNAO6ZG Confirmed. Ksh100.00 sent to DORNALD OWUOR...&#10;&#10;Paste multiple messages here (one per line)"
                      value={messages}
                      onChange={(e) => setMessages(e.target.value)}
                      className="min-h-[280px] font-mono text-sm border-0 resize-none focus-visible:ring-0"
                    />
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">
                    Tip: Paste multiple messages (one per line) to analyze them
                    all at once
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-select">Assign Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All transactions will be assigned to this category
                  </p>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing || !messages.trim()}
                  className="w-full"
                >
                  {isProcessing ? "Analyzing..." : "Analyze Transactions"}
                </Button>

                {transactions.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportJSON}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAll}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            <Card className="border-2 border-primary">
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Want More?</h3>
                  <p className="text-sm text-muted-foreground">
                    Get budgeting, income tracking, debt management, and more!
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold">Ksh 999</span>
                    <span className="text-sm text-muted-foreground line-through">
                      Ksh 1,500
                    </span>
                  </div>
                </div>
                <Link href="/login">
                  <Button className="w-full">
                    Get Full MONEE App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {!stats ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-fit mb-4">
                    <BarChart3 className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Data Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Paste your M-Pesa messages to see insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Spent
                          </p>
                          <p className="text-2xl font-bold">
                            {formatAmount(stats.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Transactions
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.totalTransactions}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Recipients
                          </p>
                          <p className="text-2xl font-bold">
                            {Object.keys(stats.byRecipient).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* By Recipient */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Recipients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.byRecipient)
                        .sort((a, b) => b[1].amount - a[1].amount)
                        .slice(0, 10)
                        .map(([key, data]) => {
                          // Get all transactions for this recipient
                          const recipientTxs = transactions.filter(
                            tx => tx.recipient && tx.recipient.trim().toLowerCase().replace(/\s+/g, " ").replace(/\b0?\d{9,10}\b/g, "").trim() === key
                          );
                          
                          // Group by amount
                          const amountGroups = recipientTxs.reduce((acc, tx) => {
                            const amt = tx.amount.toString();
                            if (!acc[amt]) acc[amt] = [];
                            acc[amt].push(tx);
                            return acc;
                          }, {} as Record<string, typeof recipientTxs>);

                          return (
                            <div key={key} className="space-y-2 border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {data.displayName}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(amountGroups).map(([amt, txs]) => (
                                      <Badge key={amt} variant="secondary" className="text-xs">
                                        {txs.length}× {formatAmount(parseFloat(amt))}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-lg">
                                    {formatAmount(data.amount)}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {data.count} payment{data.count !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <Progress
                                value={(data.amount / stats.totalAmount) * 100}
                                className="h-2"
                              />
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* By Date */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Spending by Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.byDate)
                        .sort((a, b) => {
                          const dateA = new Date(
                            b[1].transactions[0].date
                          ).getTime();
                          const dateB = new Date(
                            a[1].transactions[0].date
                          ).getTime();
                          return dateA - dateB;
                        })
                        .map(([dateKey, data]) => (
                          <div
                            key={dateKey}
                            className="border rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{dateKey}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.count} transaction
                                  {data.count !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <span className="font-bold text-lg">
                                {formatAmount(data.amount)}
                              </span>
                            </div>
                            <div className="space-y-1 pl-4 border-l-2">
                              {data.transactions.map((tx, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-muted-foreground truncate flex-1">
                                    {tx.recipient}
                                  </span>
                                  <span className="font-medium ml-2">
                                    {formatAmount(tx.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
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
