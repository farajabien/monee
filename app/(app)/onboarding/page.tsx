import db from "@/lib/db";
import Link from "next/link";
import Onboarding from "@/components/auth/onboarding";
export default async function OnboardingPage() {
  const { user } = db.useAuth();
  const { data } = await db.useQuery({
    profiles: {
      $: {
        where: {
          "user.id": user?.id ?? "",
        },
      },
    },
  });

  const profile = data?.profiles?.[0];

  if (!profile) {
    return <div>Profile not found</div>;
  }

  if (profile.onboardingCompleted) {
    return <div>Onboarding already completed</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-background to-muted/20">
      <Onboarding profile={profile} />
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
