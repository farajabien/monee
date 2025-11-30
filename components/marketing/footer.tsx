import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/AppImages/money-bag.png"
              alt="MONEE"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <span className="font-semibold">MONEE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 MONEE. Built with ❤️ in Kenya 🇰🇪
          </p>
          <div className="flex gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
