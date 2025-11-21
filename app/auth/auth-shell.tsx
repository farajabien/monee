"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import db from "@/lib/db";
import EnsureProfile from "@/components/ensure-profile";
import HomeClient from "@/app/home-client";

export default function AuthShell() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <EnsureProfile>
      <HomeClient />
    </EnsureProfile>
  );
}

