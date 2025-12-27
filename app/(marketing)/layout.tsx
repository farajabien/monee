// import { PWARedirectGuard } from "@/components/pwa/pwa-redirect-guard";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <PWARedirectGuard redirectTo="/dashboard" /> */}
      {children}
    </>
  );
}
