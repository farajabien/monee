import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Smartphone,
  TrendingUp,
  Calendar,
  Heart,
  Wallet,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  X,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Smartphone,
      title: "M-Pesa Smart Parsing",
      description:
        "Paste any M-Pesa message and MONEE instantly extracts amount, recipient, date, and category. Supports 6+ message formats.",
    },
    {
      icon: TrendingUp,
      title: "Income vs Expenses",
      description:
        "Track multiple income sources, set payday dates, and see your monthly balance at a glance.",
    },
    {
      icon: Calendar,
      title: "Daily Check-In Ritual",
      description:
        "A gentle 2-minute evening routine to paste your day's transactions. Build awareness, not guilt.",
    },
    {
      icon: Heart,
      title: "Every Little Thing I Want",
      description:
        "Track your wishes and celebrate when you get them. Because your money should make you happy.",
    },
    {
      icon: Wallet,
      title: "Smart Categorization",
      description:
        "6 built-in categories + unlimited custom ones. Auto-matches recipients to remember categories.",
    },
    {
      icon: CreditCard,
      title: "Debt Management",
      description:
        "Track all debts, set monthly payments, and see your progress toward being debt-free.",
    },
    {
      icon: BarChart3,
      title: "Monthly Insights",
      description:
        "See where your money goes by category, recipient, and week. No spreadsheets needed.",
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
      feature: "M-Pesa Transaction Parsing",
      monee: true,
      competitors: false,
    },
    {
      feature: "Auto-Categorization",
      monee: true,
      competitors: false,
    },
    {
      feature: "Income Tracking",
      monee: true,
      competitors: "Manual",
    },
    {
      feature: "Debt Management",
      monee: true,
      competitors: "Basic",
    },
    {
      feature: "Daily Check-In Flow",
      monee: true,
      competitors: false,
    },
    {
      feature: "Personal Wishlist (ELTIW)",
      monee: true,
      competitors: false,
    },
    {
      feature: "Offline Access",
      monee: true,
      competitors: false,
    },
    {
      feature: "Updates & New Features",
      monee: "Free Forever",
      competitors: "Pay Again",
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
          <div className="flex items-center gap-4">
            <Link href="/free-mpesa-analyzer-year-review">
              <Button variant="ghost">Free M-Pesa Analyzer</Button>
            </Link>
            <Link href="/login">
              <Button variant="default">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="mx-auto w-fit">
            <Zap className="h-3 w-3 mr-1" />
            Built for Real Life in Kenya 🇰🇪
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Your Money,{" "}
            <span className="text-primary">Finally in One Place</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop wondering where your money goes. MONEE tracks your M-Pesa
            spending, helps you plan, and turns personal finance into a mindful
            daily ritual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-mpesa-analyzer-year-review">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Try Free M-Pesa Analyzer
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Full Access - Ksh 999
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            ✨ One-time payment. No subscriptions. Free updates forever.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            We All Have the Same Problem
          </h2>
          <p className="text-lg text-muted-foreground">
            You <em>think</em> you know where your money goes. Until the end of
            the month, when it&apos;s gone — and you&apos;re left with
            screenshots of M-Pesa messages and good intentions.
          </p>
          <p className="text-lg">
            <strong>MONEE</strong> brings all that together and helps you
            finally <em>see</em> your financial reality — clearly, gently, and
            honestly.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No spreadsheets. No complicated formulas. Just simple, powerful
            tools that work the way you live.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
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
            <h3 className="font-semibold text-xl">Paste Messages</h3>
            <p className="text-muted-foreground">
              Copy your day&apos;s M-Pesa messages and paste them into MONEE.
              Multiple messages at once work too.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              2
            </div>
            <h3 className="font-semibold text-xl">Auto-Categorize</h3>
            <p className="text-muted-foreground">
              MONEE reads the messages, extracts details, and remembers
              categories for recurring recipients.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="font-semibold text-xl">See Insights</h3>
            <p className="text-muted-foreground">
              View where your money goes by category, person, and week. No math
              needed.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            MONEE vs Excel Templates
          </h2>
          <p className="text-lg text-muted-foreground">
            See why MONEE is worth every shilling
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
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            One payment. Lifetime access. No surprises.
          </p>
        </div>
        <div className="max-w-lg mx-auto">
          <Card className="border-4 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
              Best Value
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">MONEE Lifetime</h3>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold">Ksh 999</span>
                  <span className="text-2xl text-muted-foreground line-through">
                    Ksh 1,500
                  </span>
                </div>
                <Badge variant="secondary">Save Ksh 501 (33% OFF)</Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">What&apos;s Included:</p>
                <div className="space-y-2">
                  {[
                    "M-Pesa Smart Parser (Ksh 300 value)",
                    "Income & Expense Tracking (Ksh 250 value)",
                    "Debt Management System (Ksh 300 value)",
                    "Budget Planner (Ksh 200 value)",
                    "Category Analytics (Ksh 200 value)",
                    "ELTIW Wishlist Feature (Ksh 150 value)",
                    "Daily Check-In Reminders (Ksh 100 value)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>All future updates included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>No monthly fees, ever</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Works offline on all devices</span>
                </div>
              </div>

              <Link href="/login" className="block">
                <Button size="lg" className="w-full">
                  Get Lifetime Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground">
                Compare: Excel templates sell for Ksh 999 but offer basic
                features only
              </p>
            </CardContent>
          </Card>
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
              Join Kenyans 🇰🇪 who are finally understanding their spending and
              building better money habits — one M-Pesa message at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/free-mpesa-analyzer-year-review">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Try Free Statement Analyzer First
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Get Full Access - Ksh 999
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/AppImages/money-bag.png"
                alt="MONEE"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span className="font-semibold">MONEE</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 MONEE. Built with ❤️ in Kenya 🇰🇪
            </p>
            <div className="flex gap-4 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
