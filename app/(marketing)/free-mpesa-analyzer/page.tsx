"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  BarChart3,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function FreeMPesaAnalyzer() {
  const [smsText, setSmsText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  // Mock analysis results - will be replaced with actual parsing logic
  const mockResults = {
    totalSpent: 45670,
    totalReceived: 12500,
    transactionCount: 34,
    topCategory: "Shopping",
    topSpending: 15000,
    avgDailySpend: 1520,
    categories: [
      { name: "Shopping", amount: 15000, percentage: 33 },
      { name: "Transport", amount: 8900, percentage: 19 },
      { name: "Food & Drinks", amount: 12500, percentage: 27 },
      { name: "Entertainment", amount: 6270, percentage: 14 },
      { name: "Other", amount: 3000, percentage: 7 },
    ],
  };

  const handleAnalyze = () => {
    // TODO: Implement actual PDF parsing and SMS parsing
    setAnalyzed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mx-auto">
            <BarChart3 className="h-3 w-3 mr-1" />
            Free Tool • No Login Required
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Free M-Pesa{" "}
            <span className="text-primary">Transaction Analyzer</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            It's Monday. Can you tell where all your money went? Upload your last 3
            days, 7 days, or monthly M-Pesa statement and see everything clearly.
          </p>
          <p className="text-sm text-muted-foreground">
            ✨ Completely free • No signup required • Instant insights
          </p>
        </div>
      </section>

      {/* Analyzer Section */}
      <section className="container mx-auto px-4 py-8">
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
                    onClick={handleAnalyze}
                    disabled={!pdfFile}
                    size="lg"
                    className="w-full"
                  >
                    Analyze My Spending
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                      Tip: Copy all your M-Pesa messages from the last few days and
                      paste them here
                    </p>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!smsText.trim()}
                    size="lg"
                    className="w-full"
                  >
                    Analyze My Spending
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Section */}
          {analyzed && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-center">
                Your Spending Breakdown
              </h2>

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
                      KSh {mockResults.totalSpent.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mockResults.transactionCount} transactions
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
                      KSh {mockResults.avgDailySpend.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Daily burn rate</p>
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
                      {mockResults.topCategory}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      KSh {mockResults.topSpending.toLocaleString()}
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
                  {mockResults.categories.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">
                          KSh {category.amount.toLocaleString()} (
                          {category.percentage}%)
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
                    Sign up for MONEE and track your expenses, manage debts, build
                    savings — all in one simple app.
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
      </section>

      {/* How it Works */}
      {!analyzed && (
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  1
                </div>
                <h3 className="font-semibold">Upload or Paste</h3>
                <p className="text-sm text-muted-foreground">
                  Drop your M-Pesa PDF statement or paste SMS messages
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  2
                </div>
                <h3 className="font-semibold">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  We analyze your transactions and categorize them automatically
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  3
                </div>
                <h3 className="font-semibold">Get Insights</h3>
                <p className="text-sm text-muted-foreground">
                  See where your money went with clear charts and breakdowns
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
