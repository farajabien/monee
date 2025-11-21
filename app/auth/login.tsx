"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { Wallet, ArrowLeft } from "lucide-react";

function EmailStep({
  onSendEmail,
}: {
  onSendEmail: (email: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = inputRef.current!;
    const email = inputEl.value;
    onSendEmail(email);
    db.auth.sendMagicCode({ email }).catch((err) => {
      alert("Uh oh :" + err.body?.message);
      onSendEmail("");
    });
  };
  return (
    <form
      key="email"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-2xl font-bold">Welcome to MONEE</h2>
      <p className="text-muted-foreground">
        Enter your email and we'll send you a magic link. No password needed.
      </p>
      <input
        ref={inputRef}
        type="email"
        className="w-full border border-input bg-background px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="your@email.com"
        required
        autoFocus
      />
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
      >
        Send Magic Code
      </button>
      <p className="text-xs text-muted-foreground text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = inputRef.current!;
    const code = inputEl.value;
    db.auth.signInWithMagicCode({ email: sentEmail, code }).catch((err) => {
      inputEl.value = "";
      alert("Uh oh :" + err.body?.message);
    });
  };

  return (
    <form
      key="code"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-2xl font-bold">Check your email</h2>
      <p className="text-muted-foreground">
        We sent a code to <strong className="text-foreground">{sentEmail}</strong>. 
        Check your inbox and paste it below.
      </p>
      <input
        ref={inputRef}
        type="text"
        className="w-full border border-input bg-background px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center text-2xl tracking-widest"
        placeholder="123456"
        required
        autoFocus
        maxLength={6}
      />
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
      >
        Verify & Continue
      </button>
    </form>
  );
}

export default function Login() {
  const [sentEmail, setSentEmail] = useState("");
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="absolute top-4 left-4">
        <Link
          href="/landing"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">MONEE</span>
          </div>
        </div>

        <div className="bg-card border rounded-lg shadow-lg p-8">
          {!sentEmail ? (
            <EmailStep onSendEmail={setSentEmail} />
          ) : (
            <CodeStep sentEmail={sentEmail} />
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            First time here?{" "}
            <Link href="/landing" className="text-primary hover:underline">
              Learn about MONEE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

