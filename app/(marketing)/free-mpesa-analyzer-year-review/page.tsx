"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HowToGetStatement } from "@/components/how-to-get-statement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Calendar, DollarSign, Users, Award, ArrowRight, Upload, FileText } from "lucide-react";
import { parseMpesaMessage } from "@/lib/mpesa-parser";
import { parseStatementText, convertStatementToMessages, extractTextFromPDF } from "@/lib/statement-parser";
import type { ParsedTransactionData } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface YearStats {
  totalSpent: number;
  totalTransactions: number;
  topRecipient: { name: string; amount: number; count: number };
  monthlySpending: { month: string; amount: number }[];
  mostExpensiveMonth: { month: string; amount: number };
  categories: { category: string; amount: number; count: number }[];
  avgTransaction: number;
  firstTransaction: Date;
  lastTransaction: Date;
  availableYears: number[];
  selectedYear: number;
  allTransactions: ParsedTransactionData[];
}

export default function FreeMpesaAnalyzerPage() {
  const [messages, setMessages] = useState("");
  const [statementText, setStatementText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [yearStats, setYearStats] = useState<YearStats | null>(null);
  const [inputMethod, setInputMethod] = useState<"sms" | "statement" | "pdf">("pdf");

  const calculateAndSetStats = (allTransactions: ParsedTransactionData[], year: number, availableYears: number[]) => {
    // Filter for selected year
    const yearTransactions = allTransactions.filter(t => {
      if (!t.timestamp) return false;
      const date = new Date(t.timestamp);
      return date.getFullYear() === year;
    });

    if (yearTransactions.length === 0) {
      alert(`No transactions found for ${year}`);
      return;
    }

    // Calculate total spent
    const totalSpent = yearTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Find top recipient
    const recipientMap = new Map<string, { amount: number; count: number }>();
    yearTransactions.forEach(t => {
      if (t.recipient) {
        const current = recipientMap.get(t.recipient) || { amount: 0, count: 0 };
        recipientMap.set(t.recipient, {
          amount: current.amount + t.amount,
          count: current.count + 1
        });
      }
    });
    
    let topRecipient = { name: "Unknown", amount: 0, count: 0 };
    recipientMap.forEach((data, name) => {
      if (data.amount > topRecipient.amount) {
        topRecipient = { name, ...data };
      }
    });

    // Monthly spending
    const monthlyMap = new Map<string, number>();
    yearTransactions.forEach(t => {
      if (!t.timestamp) return;
      const date = new Date(t.timestamp);
      const monthKey = date.toLocaleDateString("en-US", { month: "long" });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
    });
    
    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    const mostExpensiveMonth = monthlySpending.reduce((max, curr) => 
      curr.amount > max.amount ? curr : max
    , { month: "", amount: 0 });

    // Transaction type breakdown
    const typeMap = new Map<string, { amount: number; count: number }>();
    yearTransactions.forEach(t => {
      const type = t.transactionType || "Other";
      const current = typeMap.get(type) || { amount: 0, count: 0 };
      typeMap.set(type, {
        amount: current.amount + t.amount,
        count: current.count + 1
      });
    });
    
    const categories = Array.from(typeMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate stats
    const avgTransaction = totalSpent / yearTransactions.length;
    const timestamps = yearTransactions.map(t => t.timestamp || 0).filter(ts => ts > 0);
    const firstTransaction = new Date(Math.min(...timestamps));
    const lastTransaction = new Date(Math.max(...timestamps));

    setYearStats({
      totalSpent,
      totalTransactions: yearTransactions.length,
      topRecipient,
      monthlySpending,
      mostExpensiveMonth,
      categories,
      avgTransaction,
      firstTransaction,
      lastTransaction,
      availableYears,
      selectedYear: year,
      allTransactions,
    });
  };

  const analyzeYear = async () => {
    if (!messages.trim() && !statementText.trim() && uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      let messagesToParse: string[] = [];

      // Handle PDF upload (supports multiple files)
      if (inputMethod === "pdf" && uploadedFiles.length > 0) {
        console.log(`Starting PDF extraction for ${uploadedFiles.length} file(s)...`);
        
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          console.log(`Processing file ${i + 1}/${uploadedFiles.length}: ${file.name}`);
          
          const pdfText = await extractTextFromPDF(file);
          console.log(`File ${i + 1} - PDF Text length:`, pdfText.length);
          
          const statementTransactions = parseStatementText(pdfText);
          console.log(`File ${i + 1} - Parsed transactions:`, statementTransactions.length);
          
          const fileMessages = convertStatementToMessages(statementTransactions);
          messagesToParse = [...messagesToParse, ...fileMessages];
          console.log(`File ${i + 1} - Converted to messages:`, fileMessages.length);
        }
        
        console.log(`Total messages from ${uploadedFiles.length} file(s):`, messagesToParse.length);
        if (messagesToParse.length > 0) {
          console.log("First message sample:", messagesToParse[0]);
        }
      }
      // Handle pasted statement text
      else if (inputMethod === "statement" && statementText.trim()) {
        console.log("Parsing statement text, length:", statementText.length);
        const statementTransactions = parseStatementText(statementText);
        console.log("Parsed statement transactions:", statementTransactions.length);
        messagesToParse = convertStatementToMessages(statementTransactions);
        console.log("Converted to messages:", messagesToParse.length);
      }
      // Handle SMS messages
      else {
        messagesToParse = messages.split('\n').filter(line => line.trim());
      }

      // Parse all messages
      const transactions = messagesToParse
        .map(line => {
          try {
            return parseMpesaMessage(line);
          } catch {
            console.log("Failed to parse:", line.substring(0, 100));
            return null;
          }
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);

      console.log("Successfully parsed transactions:", transactions.length);

      if (transactions.length === 0) {
        alert("No valid M-Pesa transactions found. Please check your input format.");
        setIsAnalyzing(false);
        return;
      }

      // Get all unique years from transactions
      const yearsSet = new Set<number>();
      transactions.forEach(t => {
        if (t.timestamp) {
          const year = new Date(t.timestamp).getFullYear();
          yearsSet.add(year);
        }
      });
      const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

      if (availableYears.length === 0) {
        alert("No valid dates found in transactions.");
        setIsAnalyzing(false);
        return;
      }

      // Default to most recent year (or 2025 if available)
      const defaultYear = availableYears.includes(2025) ? 2025 : availableYears[0];
      
      calculateAndSetStats(transactions, defaultYear, availableYears);


    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <Link href="/landing" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-4">
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
            Instantly analyze your M-Pesa spending and get your year in review. Upload your statement PDF, paste the text, or copy your SMS messages. 
            Get detailed insights about where your money goes - completely free, private, and works offline!
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

        {!yearStats ? (
          /* Input Section */
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Analyze Your M-Pesa Statement
              </CardTitle>
              <CardDescription>
                Upload your Full Statement PDF for the best experience. Supports all M-Pesa fields: Receipt No, Completion Time, Details, Transaction Status, Paid in, Withdrawn, Balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "sms" | "statement" | "pdf")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    PDF Upload
                  </TabsTrigger>
                  <TabsTrigger value="statement" className="flex items-center gap-2">
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
                    <p className="font-medium mb-2">Upload M-Pesa Full Statement PDF</p>
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
                          setUploadedFiles(prev => [...prev, ...files]);
                        }
                      }}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Choose PDF File(s)</span>
                      </Button>
                    </label>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}):</p>
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
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
Receipt No Completion Time Details Transaction Status Paid in Withdrawn Balance
REO5BUMKYX 2023-05-24 17:13:28 Pay Bill to 888880 - KPLC PREPAID COMPLETED 0.00 350.00 58.69
REO5B2H9CJ 2023-05-24 12:15:00 Airtime Purchase COMPLETED 0.00 50.00 408.69
..."
                    value={statementText}
                    onChange={(e) => setStatementText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">📄 How to copy statement text:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Download your M-Pesa Full Statement PDF</li>
                      <li>Open the PDF and select all transaction rows</li>
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
                    <p className="text-sm font-medium mb-2">💡 How to get SMS messages:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open your Messages app</li>
                      <li>Search for &quot;M-PESA&quot;</li>
                      <li>Select and copy all messages from your desired period</li>
                      <li>Paste them here</li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Note: SMS messages don&apos;t include all transaction fields. For complete analysis with Receipt No, Completion Time, Status, and exact amounts, use the Full Statement PDF.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={analyzeYear}
                disabled={(!messages.trim() && !statementText.trim() && uploadedFiles.length === 0) || isAnalyzing}
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
                <p>🔒 100% Private - Your data is processed locally in your browser and never uploaded to any server</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Hero Stats */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-2">Your {yearStats.selectedYear} M-Pesa Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-primary">{formatAmount(yearStats.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                    <p className="text-3xl font-bold">{yearStats.totalTransactions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Transaction</p>
                    <p className="text-3xl font-bold text-green-500">{formatAmount(yearStats.avgTransaction)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Year Selector */}
            {yearStats.availableYears.length > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Select Year</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Switch between {yearStats.availableYears.join(", ")} to see different years
                      </p>
                    </div>
                    <Select 
                      value={yearStats.selectedYear.toString()} 
                      onValueChange={(y) => calculateAndSetStats(yearStats.allTransactions, parseInt(y), yearStats.availableYears)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearStats.availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Recipient */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Your #1 Recipient
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-6 bg-yellow-500/10 rounded-lg">
                      <p className="text-2xl font-bold mb-2">{yearStats.topRecipient.name}</p>
                      <p className="text-3xl font-bold text-yellow-500">{formatAmount(yearStats.topRecipient.amount)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {yearStats.topRecipient.count} transactions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Most Expensive Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    Most Expensive Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold mb-2">{yearStats.mostExpensiveMonth.month}</p>
                    <p className="text-3xl font-bold text-red-500">{formatAmount(yearStats.mostExpensiveMonth.amount)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your biggest spending month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Spending Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {yearStats.monthlySpending.map((month) => (
                    <div key={month.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <span className="text-muted-foreground">{formatAmount(month.amount)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ 
                            width: `${(month.amount / yearStats.totalSpent) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Where Your Money Went
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearStats.categories.slice(0, 6).map((cat) => (
                    <div key={cat.category} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">{cat.category}</p>
                      <p className="text-2xl font-bold">{formatAmount(cat.amount)}</p>
                      <p className="text-xs text-muted-foreground">{cat.count} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Journey */}
            <Card>
              <CardHeader>
                <CardTitle>Your M-Pesa Journey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">First Transaction</p>
                    <p className="font-medium">{yearStats.firstTransaction.toLocaleDateString("en-KE", { 
                      day: "numeric", month: "long", year: "numeric" 
                    })}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Transaction</p>
                    <p className="font-medium">{yearStats.lastTransaction.toLocaleDateString("en-KE", { 
                      day: "numeric", month: "long", year: "numeric" 
                    })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Ready for Real-Time Money Tracking?</h3>
                <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
                  This free analyzer shows you the past. MONEE shows you the present and helps you plan the future. 
                  Automatic tracking, smart budgets, debt management, daily check-ins, and AI-powered insights. 
                  Stop analyzing statements manually - start tracking automatically.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/login">
                      Try MONEE Free - Ksh 999 Lifetime Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setYearStats(null)}>
                    Analyze Another Statement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Built in Kenya, for Kenyans 🇰🇪</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/landing" className="hover:text-primary">Home</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
