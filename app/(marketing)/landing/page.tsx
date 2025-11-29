import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HowToGetStatement } from "@/components/how-to-get-statement";
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
  Clock,
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
        "A gentle 2-minute evening routine to paste your day's expenses. Build awareness, not guilt.",
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
      feature: "M-Pesa Statement Import",
      monee: true,
      competitors: false,
    },
    {
      feature: "SMS Message Parsing",
      monee: true,
      competitors: false,
    },
    {
      feature: "Auto-Categorization & Learning",
      monee: true,
      competitors: "Manual",
    },
    {
      feature: "Zero-Sum Budgeting",
      monee: true,
      competitors: "Basic",
    },
    {
      feature: "Debt Tracking with Interest",
      monee: true,
      competitors: "Basic",
    },
    {
      feature: "Savings Goals & Progress",
      monee: true,
      competitors: "Manual",
    },
    {
      feature: "Business Expense Tagging",
      monee: true,
      competitors: false,
    },
    {
      feature: "Offline-First Access",
      monee: true,
      competitors: false,
    },
    {
      feature: "Mobile Optimized",
      monee: true,
      competitors: "Desktop Only",
    },
    {
      feature: "Lifetime Updates",
      monee: "Free Forever",
      competitors: "Pay Again",
    },
    {
      feature: "One-Time Payment",
      monee: true,
      competitors: "Subscription",
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
            <Link href="/login">
              <Button variant="default" size="sm" className="sm:size-default">
                <span className="hidden sm:inline">Join Waitlist</span>
                <span className="sm:hidden">Join</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Coming Soon Banner */}
      <section className="bg-primary text-primary-foreground py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm md:text-base font-medium">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            <span>Coming Soon - Launching Dec 2025</span>
          </div>
        </div>
      </section>

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

          {/* Audience-fit message */}
          <div className="flex justify-center">
            <Card className="mt-4 border-primary/80 bg-primary/10 max-w-xl w-full shadow-sm">
              <CardContent className="py-5 px-7 text-center">
                <span className="font-semibold text-primary block mb-1">
                  If your main source of income is a stipend, pocket money,
                  salary, or small business — and you use M-Pesa for 90% of your
                  expenses — MONEE is built for you.
                </span>
                <span className="text-muted-foreground text-sm">
                  Designed for students, early professionals, tech-savvy and
                  organized people who want clarity and control over their
                  money.
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Join Waitlist - Early Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            ✨ Coming soon. One-time payment of Ksh 999. No subscriptions.
            Replaces KSh 3,395+ in separate templates.
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
              Coming Soon
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">MONEE Lifetime</h3>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold">KSh 999</span>
                </div>
                <Badge variant="secondary">
                  One-time payment • Lifetime access
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Save KSh 2,396+ vs buying templates separately
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">What&apos;s Included:</p>
                <div className="space-y-2">
                  {[
                    "Zero-sum budgeting",
                    "Debt tracking with interest calculations",
                    "Savings goals with progress tracking",
                    "Business/side-hustle expense tagging",
                    "Student academic expense tracking",
                    "M-Pesa auto-import & smart categorization",
                    "Cloud sync, offline-first",
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
                  Join Waitlist for Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground">
                Launching soon. One payment of KSh 999 gets you lifetime access
                — replacing KSh 3,395+ worth of separate spreadsheets.
              </p>
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
              Join the waitlist and be among the first Kenyans 🇰🇪 to get MONEE
              at launch. One payment of Ksh 999 replaces KSh 3,395+ worth of
              separate spreadsheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Join Waitlist - Early Access
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
