import {
  Wallet,
  TrendingUp,
  CreditCard,
  BarChart3,
  Calendar,
  Smartphone,
  Shield,
  Users,
  Globe,
} from "lucide-react";

export interface Feature {
  icon: any;
  title: string;
  description: string;
}

export const CORE_FEATURES: Feature[] = [
  {
    icon: Wallet,
    title: "Quick Expense Tracking",
    description:
      "Log expenses in seconds with amount, recipient, category, and notes. Simple manual entry that works the way you live.",
  },
  {
    icon: TrendingUp,
    title: "Income Management",
    description:
      "Track multiple income sources with one-time or recurring entries. See your monthly cash flow at a glance.",
  },
  {
    icon: CreditCard,
    title: "Advanced Debt Tracking",
    description:
      "Manage debts with friend loans and Shylock (interest-bearing) plans. Track payments, see remaining balance, and payment history.",
  },
  {
    icon: Globe,
    title: "Wishlist (ELLIW) Tracking",
    description:
      "Save items you want, add links, track amounts. Mark as 'got' and automatically create an expense record.",
  },
  {
    icon: Calendar,
    title: "Recurring Transactions",
    description:
      "Mark income and expenses as recurring (weekly, monthly, yearly). Track regular payments easily.",
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
      "Try our separate free tool to analyze M-Pesa statements. Upload PDF or paste SMS for instant insights (no signup required).",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description:
      "Your data is yours, always encrypted and synced safely. Profile-based organization for better privacy.",
  },
  {
    icon: Users,
    title: "Multi-Profile Support",
    description:
      "Organize your finances with separate profiles. Perfect for managing personal and business finances.",
  },
];

export const COMPARISON_FEATURES = [
  {
    feature: "Quick Manual Entry",
    monee: true,
    competitors: "Slow",
  },
  {
    feature: "Manual Categorization",
    monee: true,
    competitors: "Manual",
  },
  {
    feature: "Debt Tracking with Payments",
    monee: true,
    competitors: "Basic",
  },
  {
    feature: "Wishlist with Links",
    monee: true,
    competitors: false,
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
    feature: "Recurring Transaction Flag",
    monee: true,
    competitors: false,
  },
  {
    feature: "Multi-Profile Organization",
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

export const PRICING_FEATURES = {
  selfHosted: [
    "Full source code access (GitHub)",
    "Deploy on your own Vercel/Netlify",
    "Configure your own InstantDB",
    "Community support",
    "Manual updates & maintenance",
    "Full control over infrastructure",
  ],
  cloudLifetime: [
    "Instant setup - start in seconds",
    "Managed secure cloud hosting",
    "Automatic backups",
    "Seamless auto-updates",
    "Priority support",
    "100% maintenance free",
    "7-day free trial included",
  ],
};
