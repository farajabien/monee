"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HowToGetStatement } from "@/components/how-to-get-statement";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  X,
  FlaskConical,
  BarChart3,
  Users,
} from "lucide-react";
import {
  CORE_FEATURES,
  COMPARISON_FEATURES,
  PRICING_FEATURES,
  SPREADSHEET_COSTS,
  TOTAL_SPREADSHEET_COST,
  HOW_IT_WORKS_STEPS,
  BETA_BENEFITS,
} from "@/lib/constants/features";

export default function LandingPage() {
  const router = useRouter();

  // Detect if app is running as PWA and redirect to dashboard
  useEffect(() => {
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    if (isPWA) {
      router.replace('/dashboard');
    }
  }, [router]);

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
                For people who bought a money spreadsheet...{" "}
                <span className="text-primary">and still feel lost</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                If tracking money feels like work, this is for you. Manage expenses, 
                <span className="text-foreground font-medium"> track friend debts</span>, and 
                <span className="text-foreground font-medium"> save for your wishlist</span> without the spreadsheet headache.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/checkout">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Monee for $10
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  <span className="text-primary">$10</span> one-time payment
                  <span className="text-muted-foreground ml-1">
                    (≈ KSh 1,500)
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  No subscription. No renewal. 7-day money-back guarantee.
                </p>
              </div>
            </div>

            {/* Right: App Screenshot */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden border-8 border-foreground/10 shadow-2xl bg-gradient-to-br from-primary/20 to-primary/5 aspect-[9/16] max-w-sm mx-auto">
                <Image
                  src="/images/monee-dashboard.jpg"
                  alt="MONEE Dashboard Screenshot - Light Mode"
                  fill
                  className="object-cover dark:hidden"
                  priority
                />
                <Image
                  src="/images/monee-dashboard-dark.jpg"
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
            You Bought the Spreadsheet. You Opened It Twice.
          </h2>

          <Card className="border-2">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Now it sits in your Downloads folder, silently judging you.
                  You're not lazy — the tool was asking too much.
                </p>

                <p className="text-base text-muted-foreground">
                  Most people buy multiple spreadsheets trying to fix the problem:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  {SPREADSHEET_COSTS.map((item, i) => (
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
                    <span className="text-destructive">{TOTAL_SPREADSHEET_COST}</span>
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
                    <strong className="text-primary">$10</strong>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_FEATURES.map((feature, index) => (
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
                {BETA_BENEFITS.map((benefit, i) => {
                  const Icon = benefit.icon === "Users" ? Users : benefit.icon === "FlaskConical" ? FlaskConical : Zap;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4">
                <Link href="/checkout">
                  <Button size="lg" className="gap-2">
                    Get Monee for $10
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
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                {item.step}
              </div>
              <h3 className="font-semibold text-xl">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            MONEE vs The Spreadsheets You Already Bought
          </h2>
          <p className="text-lg text-muted-foreground">
            You don't need more features. You need less thinking.
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
                      <th className="text-center p-4 font-semibold text-muted-foreground">
                        Spreadsheets
                      </th>
                      <th className="text-center p-4 font-semibold text-primary">
                        MONEE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-4 text-sm">{row.feature}</td>
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
                  For Developers & Tinkerers
                </Badge>
                <p className="text-sm text-muted-foreground font-medium pt-2">
                  Host it yourself. Manage everything yourself.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">What you handle:</p>
                <div className="space-y-2">
                  {PRICING_FEATURES.selfHosted.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <Link href="https://github.com/farajabien/monee" target="_blank" className="block">
                  <Button size="lg" variant="outline" className="w-full">
                    View Source Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-4 font-semibold">
                  Requires technical knowledge and ongoing maintenance.
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
                <h3 className="text-2xl font-bold">Cloud Lifetime — $10</h3>
                <p className="text-base text-muted-foreground font-semibold">
                  For people who just want it to work.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-5xl font-bold text-primary">
                    $10
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">
                      One-time
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ KSh 1,500
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-2">
                  <Badge variant="default" className="text-sm w-fit mx-auto">
                    No subscription
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    No trial. No renewal. No maintenance.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">What we handle for you:</p>
                <div className="space-y-2">
                  {PRICING_FEATURES.cloudLifetime.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link href="/checkout" className="block">
                  <Button size="lg" className="w-full text-base font-semibold">
                    Buy Once for $10
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  7-day money-back guarantee. Start using immediately.
                </p>
              </div>
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
              Pay once. Use forever. No subscription, no renewal, no maintenance.
              Just $10 — replaces multiple expensive tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/checkout">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Get Monee for $10
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
