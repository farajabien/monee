"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HowToGetStatement } from "@/components/how-to-get-statement";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  Smartphone,
  TrendingUp,
  Calendar,
  Wallet,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  X,
  Users,
  FlaskConical,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Wallet,
      title: "Quick Expense Tracking",
      description:
        "Log expenses manually or import from M-Pesa statements. Smart auto-categorization learns your spending patterns.",
    },
    {
      icon: TrendingUp,
      title: "Income Management",
      description:
        "Track multiple income sources with payday scheduling. See your monthly cash flow and balance at a glance.",
    },
    {
      icon: CreditCard,
      title: "Advanced Debt Tracking",
      description:
        "Manage one-time debts, interest-push plans, and amortizing loans with payment schedules and progress tracking.",
    },
    {
      icon: BarChart3,
      title: "Savings Goals",
      description:
        "Set targets, track contributions, and watch your savings grow month by month.",
    },
    {
      icon: Calendar,
      title: "Recurring Transactions",
      description:
        "Set up recurring expenses with reminders. Mark as paid with one tap and track payment history automatically.",
    },
    {
      icon: BarChart3,
      title: "Powerful Analytics",
      description:
        "Category breakdowns, spending trends, recipient tracking, and cash flow analysis. All your data at a glance.",
    },
    {
      icon: Smartphone,
      title: "Free M-Pesa Analyzer",
      description:
        "Try our free statement analyzer before signing up. Upload PDF or paste SMS to see instant spending insights.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description:
        "Your data is yours, always encrypted and synced safely. Works offline too.",
    },
  ];

  const comparison = [
    {
      feature: "Quick Manual Entry",
      monee: true,
      competitors: "Slow",
    },
    {
      feature: "Auto-Categorization & Learning",
      monee: true,
      competitors: "Manual",
    },
    {
      feature: "Debt Tracking with Progress",
      monee: true,
      competitors: "Basic",
    },
    {
      feature: "Savings Goals & Targets",
      monee: true,
      competitors: "Manual",
    },
    {
      feature: "Rich Analytics & Charts",
      monee: true,
      competitors: "Basic",
    },
    {
      feature: "Income Source Tracking",
      monee: true,
      competitors: false,
    },
    {
      feature: "M-Pesa Bulk Import (Optional)",
      monee: true,
      competitors: false,
    },
    {
      feature: "Offline-First PWA",
      monee: true,
      competitors: false,
    },
    {
      feature: "Mobile Optimized",
      monee: true,
      competitors: "Desktop Only",
    },
    {
      feature: "Pricing",
      monee: "KSh 999 Lifetime",
      competitors: "Monthly Subscription",
    },
    {
      feature: "Free Updates Forever",
      monee: true,
      competitors: false,
    },
  ];

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
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="default" size="sm" className="sm:size-default">
                <span className="hidden sm:inline">Try Free for 1 Week</span>
                <span className="sm:hidden">Try Free</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                {/* <BetaBadge variant="gradient" size="sm" /> */}
                <Badge variant="secondary" className="w-fit">
                  <Zap className="h-3 w-3 mr-1" />
                  Built for Real Life in Kenya 🇰🇪
                </Badge>
                <Link href="/settings?tab=feedback">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <FlaskConical className="h-3 w-3 mr-1" />
                    Beta Testers Needed - Submit Feedback
                  </Badge>
                </Link>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Money,{" "}
                <span className="text-primary">Finally in One Place</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Track expenses in seconds, manage debts with progress tracking,
                crush savings goals, and see where every shilling goes. All your
                financial data organized with smart categorization and analytics.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Download App - Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  ✨ Free to download • 7-day free trial included
                </p>
                <p className="text-sm font-medium">
                  Then just <span className="text-primary">KSh 999</span>{" "}
                  one-time payment
                  <span className="text-muted-foreground ml-1">
                    (Worth KSh 10,000-15,000)
                  </span>
                </p>
              </div>
            </div>

            {/* Right: App Screenshot */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden border-8 border-foreground/10 shadow-2xl bg-gradient-to-br from-primary/20 to-primary/5 aspect-[9/16] max-w-sm mx-auto">
                <Image
                  src="/images/monee-dashboard.jpeg"
                  alt="MONEE Dashboard Screenshot - Light Mode"
                  fill
                  className="object-cover dark:hidden"
                  priority
                />
                <Image
                  src="/images/monee-dashboard-dark.jpeg"
                  alt="MONEE Dashboard Screenshot - Dark Mode"
                  fill
                  className="object-cover hidden dark:block"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            Stop Juggling Spreadsheets
          </h2>
          
          <Card className="border-2">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Most people buy 5-6 different spreadsheets just to manage their money:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { name: "Budget Tracker", price: "KSh 500" },
                    { name: "Debt Calculator", price: "KSh 700" },
                    { name: "Savings Planner", price: "KSh 600" },
                    { name: "Expense Tracker", price: "KSh 800" },
                    { name: "Income Tracker", price: "KSh 500" },
                    { name: "Category Manager", price: "KSh 395" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Cost:</span>
                    <span className="text-destructive">KSh 3,495+</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ...and they don&apos;t sync or talk to each other
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg">
                    <strong className="text-primary">MONEE</strong> replaces them all for just{" "}
                    <strong className="text-primary">KSh 999</strong>
                  </p>
                </div>
                <div className="pl-12 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm">One app with everything included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm">Lifetime access, no subscriptions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm">Automatic sync across all devices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm">Real-time insights into your complete financial picture</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Free Analyzer CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-base">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Free Tool • No Login Required
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  It&apos;s Monday. Where Did Your Weekend Money Go?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Stop guessing. Upload your M-Pesa statement or paste SMS messages
                  from the last 3 days, 7 days, or full month. Get instant insights
                  into who you&apos;re spending with most.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">0 min</div>
                  <p className="text-sm text-muted-foreground">Setup time required</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <p className="text-sm text-muted-foreground">Free forever</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">30 sec</div>
                  <p className="text-sm text-muted-foreground">To see results</p>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/free-mpesa-analyzer">
                  <Button size="lg" className="w-full sm:w-auto">
                    Analyze Your Spending Now - Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                ✨ No signup • No credit card • Private (data stays in your browser)
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for Personal Finance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No spreadsheets. No complicated formulas. Just simple, powerful
            tools that work the way you live.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof / Beta Testing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="flex justify-center">
                {/* <BetaBadge variant="gradient" size="lg" /> */}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Help Shape the Future of MONEE
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We&apos;ve just completed major updates: profile-based organization,
                recurring transactions, advanced debt tracking, and more. Test the
                new features and help us make MONEE even better.
              </p>
              <div className="grid md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Early Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Be among the first to use new features
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <FlaskConical className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Shape the Product</h3>
                  <p className="text-sm text-muted-foreground">
                    Your feedback directly impacts development
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Exclusive Benefits</h3>
                  <p className="text-sm text-muted-foreground">
                    Special perks for early supporters
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Try Beta - Free for 7 Days
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple Daily Ritual
          </h2>
          <p className="text-lg text-muted-foreground">
            Just 2 minutes a day to stay on top of your money
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              1
            </div>
            <h3 className="font-semibold text-xl">Log Expenses</h3>
            <p className="text-muted-foreground">
              Add expenses manually in seconds, or paste M-Pesa messages for
              bulk import. Your choice.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              2
            </div>
            <h3 className="font-semibold text-xl">Auto-Categorize</h3>
            <p className="text-muted-foreground">
              MONEE learns your spending patterns and remembers categories for
              recurring expenses automatically.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="font-semibold text-xl">See Insights</h3>
            <p className="text-muted-foreground">
              View where your money goes by category, time period, and
              recipient. No math needed.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            MONEE vs Other Finance Apps
          </h2>
          <p className="text-lg text-muted-foreground">
            See why MONEE is the smartest choice for Kenyan users
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold text-primary">
                        MONEE
                      </th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">
                        Competitors
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-4 text-sm">{row.feature}</td>
                        <td className="p-4 text-center">
                          {typeof row.monee === "boolean" ? (
                            row.monee ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium text-green-600">
                              {row.monee}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.competitors === "boolean" ? (
                            row.competitors ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {row.competitors}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Open Source & Fair Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            MONEE is open source software. You can host it yourself for free, or
            pay a small one-time fee for our managed cloud version.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Self-Hosted Option */}
          <Card className="border-2 relative">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Self-Hosted</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold">Free</span>
                  <span className="text-muted-foreground">/ Forever</span>
                </div>
                <Badge variant="outline" className="text-base">
                  For Developers & DIYers
                </Badge>
                <p className="text-sm text-muted-foreground font-medium pt-2">
                  Host it yourself. You own your data infrastructure.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">What you get:</p>
                <div className="space-y-2">
                  {[
                    "Full source code access (GitHub)",
                    "Deploy on your own Vercel/Netlify",
                    "Configure your own InstantDB",
                    "Community support",
                    "Manual updates & maintenance",
                    "Full control over infrastructure",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <Link href="https://github.com/yourusername/monee" target="_blank" className="block">
                  <Button size="lg" variant="outline" className="w-full">
                    View Source Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Requires technical knowledge to set up and maintain.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Lifetime Option */}
          <Card className="border-4 border-primary relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
              Most Popular
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Cloud Lifetime</h3>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-bold text-primary">
                    KSh 999
                  </span>
                  <div className="text-left">
                    <div className="text-xl text-muted-foreground line-through">
                      KSh 10,000
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="text-base">
                  One-time Payment
                </Badge>
                <p className="text-sm text-muted-foreground font-semibold pt-2">
                  Zero setup. We handle hosting, backups, and updates.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Everything in Self-Hosted plus:</p>
                <div className="space-y-2">
                  {[
                    "Instant setup - start in seconds",
                    "Managed secure cloud hosting",
                    "Automatic backups",
                    "Seamless auto-updates",
                    "Priority support",
                    "100% maintenance free",
                    "7-day free trial included",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link href="/login" className="block">
                  <Button size="lg" className="w-full">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Free to download. 7-day free trial. Then KSh 999 one-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to Get Your Statement Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Get Started in 60 Seconds
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No need to copy hundreds of SMS messages. Just export your M-Pesa
              statement and upload it.
            </p>
          </div>
          <HowToGetStatement />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Take Control of Your Money?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Start your free 1-week trial today and join Kenyans 🇰🇪 who are
              taking control of their finances. Then just KSh 999 one-time —
              replaces KSh 3,395+ worth of separate spreadsheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Download App Now - Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      {/* FAQ Section */}
      {/* <FAQSection /> */}

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
}
