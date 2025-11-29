import Link from "next/link";
import Onboarding from "@/components/auth/onboarding";
export default async function OnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-background to-muted/20">
      <Onboarding />
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
    </div>
  );
}
