import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HowToGetStatement } from "@/components/how-to-get-statement";
import { FAQSection } from "@/components/marketing/faq-section";
import { Footer } from "@/components/marketing/footer";
import { BetaBadge } from "@/components/marketing/beta-badge";
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
        "Log expenses manually in seconds with smart categorization. Simple, fast, and builds the habit.",
    },
    {
      icon: TrendingUp,
      title: "Income vs Expenses",
      description:
        "Track multiple income sources, set payday dates, and see your monthly balance at a glance.",
    },
    {
      icon: CreditCard,
      title: "Debt Management",
      description:
        "Track all debts, set monthly payments, and see your progress toward being debt-free.",
    },
    {
      icon: BarChart3,
      title: "Savings Goals",
      description:
        "Set targets, track contributions, and watch your savings grow month by month.",
    },
    {
      icon: Calendar,
      title: "Daily Check-In Ritual",
      description:
        "A gentle 2-minute evening routine to log your day's expenses. Build awareness, not guilt.",
    },
    {
      icon: BarChart3,
      title: "Rich Analytics",
      description:
        "See where your money goes by category, recipient, and time period. No spreadsheets needed.",
    },
    {
      icon: Smartphone,
      title: "M-Pesa Import (Optional)",
      description:
        "Want to bulk-clean old transactions? Upload M-Pesa statements. Great for catching up, not required daily.",
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
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <BetaBadge variant="gradient" size="sm" />
                <Badge variant="secondary" className="w-fit">
                  <Zap className="h-3 w-3 mr-1" />
                  Built for Real Life in Kenya 🇰🇪
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Money,{" "}
                <span className="text-primary">Finally in One Place</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Stop wondering where your money goes. MONEE helps you track
                expenses, manage debts, save smarter, and turns personal finance
                into a mindful daily ritual.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Download App - Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                ✨ Free to download. 7-day free trial. Then KSh 999 one-time
                payment — true value: KSh 10,000-15,000.
              </p>
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
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            We All Have the Same Problem
          </h2>
          <p className="text-lg text-muted-foreground">
            You <em>think</em> you know where your money goes. Until the end of
            the month, when it&apos;s gone — and you&apos;re left wondering what
            happened.
          </p>
          <p className="text-lg">
            <strong>MONEE</strong> helps you finally <em>see</em> your financial
            reality — clearly, gently, and honestly. Track expenses in seconds,
            manage debts, build savings, and understand your spending patterns.
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

      {/* Social Proof / Beta Testing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="flex justify-center">
                <BetaBadge variant="gradient" size="lg" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Join Our Beta Testing Community
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We&apos;re in beta – join our first users testing and shaping
                the app. Your feedback directly influences MONEE&apos;s
                development.
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
            The Smartest Money App in Kenya — For Less Than Lunch
          </h2>
          <p className="text-lg text-muted-foreground">
            Free to download. 7-day free trial. Then one payment, yours forever.
          </p>
        </div>
        <div className="max-w-lg mx-auto">
          <Card className="border-4 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
              Limited Lifetime Offer
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">MONEE Lifetime Access</h3>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-bold text-primary">
                    KSh 999
                  </span>
                  <div className="text-left">
                    <div className="text-2xl text-muted-foreground line-through">
                      KSh 10,000
                    </div>
                    <div className="text-xs text-muted-foreground">
                      True Value
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-base">
                  One-time payment • Lifetime access • Best deal ever
                </Badge>
                <p className="text-sm text-muted-foreground font-semibold">
                  Worth KSh 10,000-15,000. Pay once. Own forever. No monthly
                  fees.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Everything Included:</p>
                <div className="space-y-2">
                  {[
                    "Quick expense tracking (manual or M-Pesa import)",
                    "Debt tracking with progress visualization",
                    "Savings goals with target tracking",
                    "Income source management",
                    "Rich analytics and insights",
                    "Auto-categorization & learning",
                    "Offline-first PWA - works everywhere",
                    "Cloud sync across all devices",
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
                  <span>7-day free trial included</span>
                </div>
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
                  Download App - Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground">
                Free to download. 7-day free trial. No credit card required.
                Then KSh 999 one-time — worth KSh 10,000-15,000. Best deal ever.
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
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
