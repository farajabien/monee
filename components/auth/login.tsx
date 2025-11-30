"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import db from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
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
      <p className="text-muted-foreground">
        Enter your email and we&apos;ll send you a magic code. No password
        needed.
      </p>
      <Input
        ref={inputRef}
        type="email"
        placeholder="your@email.com"
        required
        autoFocus
      />
      <Button type="submit" className="w-full">
        Send Magic Code
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
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
        We sent a code to{" "}
        <strong className="text-foreground">{sentEmail}</strong>. Check your
        inbox and paste it below.
      </p>
      <Input
        ref={inputRef}
        type="text"
        className="font-mono text-center text-2xl tracking-widest"
        placeholder="123456"
        required
        autoFocus
        maxLength={6}
      />
      <Button type="submit" className="w-full">
        Verify & Continue
      </Button>
    </form>
  );
}

export default function Login() {
  const [sentEmail, setSentEmail] = useState("");
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // Only query the user's profile if user exists
  const { data, isLoading: profileLoading } = db.useQuery(
    user
      ? {
          profiles: {
            $: {
              where: {
                "user.id": user.id,
              },
            },
          },
        }
      : null
  );

  // Redirect based on onboarding status
  useEffect(() => {
    if (!isLoading && !profileLoading && user) {
      const profile = data?.profiles?.[0];

      if (!profile) {
        // No profile exists, redirect to onboarding
        router.push("/onboarding");
      } else if (!profile.onboardingCompleted) {
        // Profile exists but onboarding not completed
        router.push("/onboarding");
      } else {
        // Onboarding completed, go to dashboard
        router.push("/dashboard");
      }
    }
  }, [isLoading, profileLoading, user, data, router]);

  if (isLoading || (user && profileLoading)) {
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
            <Image
              src="/AppImages/money-bag.png"
              alt="MONEE"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-bold text-2xl">MONEE</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {!sentEmail ? (
              <EmailStep onSendEmail={setSentEmail} />
            ) : (
              <CodeStep sentEmail={sentEmail} />
            )}
          </CardContent>
        </Card>

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
