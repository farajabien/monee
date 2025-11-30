"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = {
  general: {
    title: "General Usage",
    icon: "📱",
    questions: [
      {
        q: "How do I get started with MONEE?",
        a: "After signing up, you'll go through a quick 4-step onboarding process where you'll select your currency, set up spending categories, add income sources, and optionally add recurring expenses. This helps MONEE understand your financial situation and provide accurate insights.",
      },
      {
        q: "What is the Cash Runway feature?",
        a: "Cash Runway predicts whether you'll make it to your next payday based on your current balance and spending patterns. It shows you your daily average spend, gives discipline indicators, and suggests a maximum daily budget to ensure you don't run out of money before payday.",
      },
      {
        q: "Can I customize my spending categories?",
        a: "Yes! While MONEE provides default categories (Food, Transport, Housing, Utilities, Savings, Misc), you can add unlimited custom categories with your own names and colors. You can manage these in the Categories section.",
      },
      {
        q: "How does MONEE track my expenses?",
        a: "You can manually add expenses or use our M-Pesa integration to automatically track transactions from your phone. MONEE categorizes your spending and helps you visualize where your money goes each month.",
      },
    ],
  },
  features: {
    title: "Features & Capabilities",
    icon: "⚡",
    questions: [
      {
        q: "What features does MONEE offer?",
        a: "MONEE provides expense tracking, budget management, cash runway predictions, debt tracking, savings goals, income management, spending analytics, category breakdowns, and M-Pesa integration. All designed to help you take control of your finances.",
      },
      {
        q: "Does MONEE support multiple currencies?",
        a: "Yes! MONEE supports multiple currencies including KES (Kenyan Shilling), USD, EUR, GBP, NGN, ZAR, TZS, and UGX. You select your preferred currency during onboarding, and all amounts will be displayed in that currency.",
      },
      {
        q: "Can I export my data?",
        a: "Absolutely! You can export your complete financial data as JSON or export transaction history as CSV from the Settings page. This allows you to backup your data or analyze it in other tools.",
      },
      {
        q: "Is there a mobile app?",
        a: "MONEE is a progressive web app (PWA), which means you can add it to your phone's home screen and use it like a native app. It works seamlessly on both mobile and desktop browsers.",
      },
    ],
  },
  billing: {
    title: "Billing & Subscription",
    icon: "💳",
    questions: [
      {
        q: "How much does MONEE cost?",
        a: "MONEE offers a 7-day free trial so you can explore all features. After the trial, you can purchase lifetime access for a one-time payment. No recurring subscriptions or hidden fees.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept payments via M-Pesa and other payment methods through Paystack. The payment process is secure and straightforward.",
      },
      {
        q: "What happens after my free trial ends?",
        a: "After your 7-day free trial, you'll need to purchase lifetime access to continue using MONEE. Your data is safe and will be available when you upgrade.",
      },
      {
        q: "Do you offer refunds?",
        a: "Since MONEE offers a comprehensive 7-day free trial, we generally don't offer refunds. However, if you experience technical issues, please contact our support team at support@monee.app.",
      },
    ],
  },
  privacy: {
    title: "Data & Privacy",
    icon: "🔒",
    questions: [
      {
        q: "Is my financial data secure?",
        a: "Yes! We take security seriously. Your data is encrypted and stored securely. We use industry-standard authentication and never store sensitive information like your M-Pesa PIN or passwords.",
      },
      {
        q: "Who can see my financial information?",
        a: "Only you can see your financial information. MONEE is designed for personal use, and we don't share your data with third parties for marketing or advertising purposes.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes, you have full control over your data. You can permanently delete your account and all associated data from the Settings page under the Account tab. This action is irreversible.",
      },
      {
        q: "Where is my data stored?",
        a: "Your data is stored securely in the cloud using InstantDB's infrastructure. This ensures your data is backed up and accessible from any device while maintaining high security standards.",
      },
    ],
  },
};

export function FAQSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about MONEE. Can't find an answer? Reach
            out to us at{" "}
            <a
              href="mailto:support@monee.app"
              className="text-primary hover:underline"
            >
              support@monee.app
            </a>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* General Usage */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{faqData.general.icon}</span>
              <h3 className="text-xl font-semibold">{faqData.general.title}</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.general.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`general-${index}`}
                  className="border rounded-lg px-4 bg-background"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Features & Capabilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{faqData.features.icon}</span>
              <h3 className="text-xl font-semibold">{faqData.features.title}</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.features.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`features-${index}`}
                  className="border rounded-lg px-4 bg-background"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Billing & Subscription */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{faqData.billing.icon}</span>
              <h3 className="text-xl font-semibold">{faqData.billing.title}</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.billing.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`billing-${index}`}
                  className="border rounded-lg px-4 bg-background"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Data & Privacy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{faqData.privacy.icon}</span>
              <h3 className="text-xl font-semibold">{faqData.privacy.title}</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.privacy.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`privacy-${index}`}
                  className="border rounded-lg px-4 bg-background"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
