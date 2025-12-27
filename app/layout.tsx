import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "../components/service-worker-register";
import Script from "next/script";

export const metadata: Metadata = {
  title: "MONEE - Your Personal Finance Companion for Kenya",
  description:
    "Track expenses, manage debts, build savings — all in one simple app. Built for real life in Kenya 🇰🇪. Free to download, 7-day trial, then KSh 999 lifetime access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegister />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
      `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
