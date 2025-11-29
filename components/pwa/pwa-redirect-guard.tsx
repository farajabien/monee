"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Component that detects if user is in PWA mode and redirects to external browser
 * if they try to access marketing pages
 */
export function PWARedirectGuard({
  redirectTo = "/dashboard",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if the display mode is standalone (PWA mode)
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - Safari specific
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isPWA) {
      // User is in PWA mode trying to access marketing page
      // Redirect to the app instead
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  return null;
}
