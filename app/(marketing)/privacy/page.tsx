import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, UserX } from "lucide-react";
import Image from "next/image";

export default function PrivacyPage() {
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
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>

        {/* Privacy Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Lock className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">End-to-End Encryption</h3>
              <p className="text-sm text-muted-foreground">
                Your data is encrypted and secure
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Eye className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">No Selling Data</h3>
              <p className="text-sm text-muted-foreground">
                We never sell your information
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Database className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Local First</h3>
              <p className="text-sm text-muted-foreground">
                Analyzer runs 100% offline
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At MONEE, we take your privacy seriously. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our personal finance management
                application. Please read this privacy policy carefully. If you
                do not agree with the terms of this privacy policy, please do
                not access the application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                2. Information We Collect
              </h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>
                  <strong>Account Information:</strong> Email address for
                  authentication via magic link
                </li>
                <li>
                  <strong>Profile Data:</strong> Optional profile information
                  like name and preferences
                </li>
                <li>
                  <strong>Financial Data:</strong> Expense details, budget
                  amounts, income sources, debt information, and spending
                  categories you manually input
                </li>
                <li>
                  <strong>M-Pesa Messages:</strong> SMS message content you
                  paste into the analyzer
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                2.2 Automatically Collected Information
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>
                  <strong>Device Information:</strong> Browser type, operating
                  system, device identifiers
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used,
                  time spent in the app
                </li>
                <li>
                  <strong>Log Data:</strong> IP address, access times, error
                  logs
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                2.3 Free Analyzer Tool
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The free M-Pesa analyzer processes all data locally in your
                browser using IndexedDB.{" "}
                <strong>
                  No expense data from the analyzer is sent to our servers.
                </strong>{" "}
                The analyzer works 100% offline and your data remains on your
                device.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong>Provide Services:</strong> Process expenses, generate
                  insights, track budgets, and deliver core functionality
                </li>
                <li>
                  <strong>Account Management:</strong> Create and manage your
                  account, authenticate users via magic link
                </li>
                <li>
                  <strong>Personalization:</strong> Customize your experience,
                  remember preferences, provide relevant insights
                </li>
                <li>
                  <strong>Communication:</strong> Send service updates, respond
                  to inquiries, notify about important changes
                </li>
                <li>
                  <strong>Improvements:</strong> Analyze usage patterns to
                  improve features and user experience
                </li>
                <li>
                  <strong>Security:</strong> Detect fraud, prevent abuse, and
                  ensure platform security
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Comply with legal
                  obligations and enforce our Terms of Service
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                4. Data Storage and Security
              </h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                4.1 Security Measures
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>End-to-end encryption for data transmission</li>
                <li>Encrypted database storage using InstantDB</li>
                <li>
                  Secure authentication with magic links (no passwords to steal)
                </li>
                <li>Regular security audits and updates</li>
                <li>HTTPS/SSL for all connections</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                4.2 Data Retention
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active or as
                needed to provide services. If you delete your account, we will
                delete your personal data within 30 days, except where retention
                is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                5. Information Sharing and Disclosure
              </h2>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                5.1 We DO NOT Sell Your Data
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <strong>
                  MONEE does not sell, rent, or trade your personal financial
                  information to third parties.
                </strong>{" "}
                Your financial data is private and belongs to you.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                5.2 Service Providers
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We may share data with trusted service providers who assist in
                operating our platform:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>
                  <strong>InstantDB:</strong> Database hosting and
                  authentication services
                </li>
                <li>
                  <strong>Payment Processors:</strong> Secure payment processing
                  (they receive minimal data necessary for transactions)
                </li>
                <li>
                  <strong>Analytics Providers:</strong> Anonymous usage
                  analytics to improve the service
                </li>
                <li>
                  <strong>Cloud Hosting:</strong> Secure infrastructure
                  providers
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                All service providers are bound by confidentiality agreements
                and data protection requirements.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                5.3 Legal Requirements
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose your information if required by law, court
                order, or government request, or to protect our rights,
                property, or safety.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                6. Your Privacy Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of all data we have
                  about you
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and data (right to be forgotten)
                </li>
                <li>
                  <strong>Export:</strong> Download your data in a portable
                  format (CSV, JSON)
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing
                  communications
                </li>
                <li>
                  <strong>Restriction:</strong> Request limitation of data
                  processing
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:hello@monee.co.ke"
                  className="text-primary hover:underline"
                >
                  hello@monee.co.ke
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                7. M-Pesa Data Processing
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE is not affiliated with Safaricom or M-Pesa. We do not have
                direct access to your M-Pesa account. You manually paste M-Pesa
                SMS messages into the app. When using the full MONEE app, parsed
                expense data is stored securely in your encrypted account. When
                using the free analyzer, all data processing happens locally in
                your browser and is never transmitted to our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                8. Cookies and Tracking Technologies
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns (anonymized)</li>
                <li>Improve service performance</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You can disable cookies in your browser settings, but this may
                limit functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                9. Third-Party Links
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE may contain links to third-party websites or services. We
                are not responsible for the privacy practices of these external
                sites. We encourage you to review their privacy policies before
                providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MONEE is not intended for users under the age of 18. We do not
                knowingly collect personal information from children. If you
                believe we have collected data from a child, please contact us
                immediately, and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                11. International Data Transfers
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries other
                than Kenya where our service providers operate. We ensure
                appropriate safeguards are in place to protect your data in
                accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                12. Data Breach Notification
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a data breach that compromises your personal
                information, we will notify affected users within 72 hours and
                provide details about the breach and steps taken to address it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                13. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes via email or through a
                prominent notice in the application. The &quot;Last
                Updated&quot; date at the bottom of this policy indicates when
                it was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p className="text-muted-foreground">
                  <strong>General Inquiries:</strong>{" "}
                  <a
                    href="mailto:hello@monee.co.ke"
                    className="text-primary hover:underline"
                  >
                    hello@monee.co.ke
                  </a>
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong>Support:</strong>{" "}
                  <a
                    href="mailto:support@monee.co.ke"
                    className="text-primary hover:underline"
                  >
                    support@monee.co.ke
                  </a>
                </p>
              </div>
            </section>

            <section className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Your Privacy Matters</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    At MONEE, your financial privacy is our top priority.
                    We&apos;re committed to transparency and giving you full
                    control over your data.
                  </p>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t mt-6">
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
