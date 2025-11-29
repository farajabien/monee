import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function TermsPage() {
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
          <Link href="/landing">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <Card>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using MONEE (&quot;the Service&quot;), you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to these Terms of Service, please
                do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                MONEE is an all-in-one personal finance management application
                built for Kenya that helps users:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Track M-Pesa transactions and expenses</li>
                <li>Create and manage zero-sum budgets</li>
                <li>Monitor income sources and savings goals</li>
                <li>
                  Manage debts with interest calculations and payment schedules
                </li>
                <li>Track business/side-hustle expenses</li>
                <li>Monitor student academic expenses</li>
                <li>Analyze spending patterns with recipient-based insights</li>
                <li>Predict cash runway until next payday</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To use MONEE, you must create an account using a valid email
                address. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                4. Data Privacy and Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your financial data is stored securely using InstantDB with
                end-to-end encryption. We do not sell or share your personal
                financial information with third parties. MONEE is offline-first
                and syncs across your devices when online. For more details,
                please review our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                5. Payment and Pricing
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                MONEE offers a one-time payment model:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>
                  Full app access for KSh 999 (one-time payment, lifetime
                  access)
                </li>
                <li>
                  All features included: budgeting, debt tracking, savings
                  goals, M-Pesa integration, business/student modes
                </li>
                <li>
                  All future updates and new features included at no additional
                  cost
                </li>
                <li>
                  Payments are processed securely through our payment partners
                </li>
                <li>
                  Refunds may be issued at our discretion within 14 days of
                  purchase
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code or viruses</li>
                <li>
                  Scrape or collect data from the Service using automated means
                </li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                7. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of MONEE, including but
                not limited to text, graphics, logos, icons, images, and
                software, are the exclusive property of MONEE and are protected
                by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE is provided &quot;as is&quot; without warranties of any
                kind. We do not guarantee that the Service will be
                uninterrupted, secure, or error-free. While we strive for
                accuracy in M-Pesa message parsing, transaction categorization,
                and financial calculations, we are not responsible for any
                financial decisions made based on information provided by the
                Service. MONEE is a personal finance tracking tool, not
                financial advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                9. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE and its affiliates shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages
                resulting from your use or inability to use the Service. This
                includes but is not limited to loss of profits, data, or
                financial losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                10. M-Pesa Integration
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE allows you to manually paste M-Pesa SMS messages or upload
                M-Pesa statements to automatically import and categorize your
                transactions. We are not affiliated with, endorsed by, or
                partnered with Safaricom or M-Pesa. Users are responsible for
                manually inputting their M-Pesa data. We do not have direct
                access to your M-Pesa account, Safaricom systems, or any
                third-party financial services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                11. Modifications to Service
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the
                Service (or any part thereof) at any time with or without
                notice. We will not be liable to you or any third party for any
                modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice or liability, for any
                reason, including breach of these Terms. Upon termination, your
                right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of Kenya, without regard to its conflict of law
                provisions. Any disputes arising from these Terms or your use of
                the Service shall be subject to the exclusive jurisdiction of
                the courts of Kenya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                14. Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to update or modify these Terms at any
                time. We will notify users of significant changes via email or
                through the Service. Your continued use of the Service after
                such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                15. Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email:{" "}
                <a
                  href="mailto:support@monee.co.ke"
                  className="text-primary hover:underline"
                >
                  support@monee.co.ke
                </a>
              </p>
              <p className="text-muted-foreground mt-1">
                Website:{" "}
                <a
                  href="https://monee.co.ke"
                  className="text-primary hover:underline"
                >
                  monee.co.ke
                </a>
              </p>
            </section>

            <section className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
